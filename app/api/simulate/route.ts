import { NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/kim/chatrooms'
import { routing } from '@/i18n/routing'
import { getKIMDictionarySource, normalizeLanguage } from '@/lib/language'
import { Type, type DialogueNode } from '@/lib/types'
import { loadDictionary, loadNodes } from '@/lib/kim/loader'
import {
  getConversationName,
  getBooleanName,
  getCounterName,
  resolveContent,
  resolveStartNodes,
  sourceLabel,
} from '@/lib/kim/node-utils'
import { explorePaths } from '@/lib/kim/explorer'
import { evaluateCounterOutput } from '@/lib/kim/counter-utils'
import { isFlirtingBoolean } from '@/lib/kim/boolean-utils'
import { buildPreferredPathOptions, summarizeResults } from '@/lib/kim/ranker'
import { formatPathAsChat, formatPathMetrics } from '@/lib/kim/formatter'

function unique(values: number[]): number[] {
  return [...new Set(values)]
}

function booleanMutationSignature(mutations: Record<string, boolean>): string {
  return Object.entries(mutations)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value ? '1' : '0'}`)
    .join('|')
}

function getFlirtingPathSignature(
  result: Awaited<ReturnType<typeof explorePaths>>[number],
  byId: Map<number, DialogueNode>
): string {
  const names = new Set<string>()

  for (const nodeId of result.path) {
    const node = byId.get(nodeId)
    if (!node) {
      continue
    }

    const isBooleanMutationNode =
      node.type === Type.SetBooleanDialogueNode ||
      node.type === Type.ResetBooleanDialogueNode
    if (!isBooleanMutationNode) {
      continue
    }

    const name = getBooleanName(node)
    if (isFlirtingBoolean(name)) {
      names.add(name)
    }
  }

  if (names.size === 0) {
    return 'no-flirting'
  }

  return 'flirting:' + [...names].sort().join('|')
}

function getBooleanMutationsFromPath(
  result: Awaited<ReturnType<typeof explorePaths>>[number],
  byId: Map<number, DialogueNode>
): Record<string, boolean> {
  const mutations: Record<string, boolean> = {}

  for (const nodeId of result.path) {
    const node = byId.get(nodeId)
    if (!node) {
      continue
    }

    if (node.type === Type.SetBooleanDialogueNode) {
      mutations[getBooleanName(node)] = true
    } else if (node.type === Type.ResetBooleanDialogueNode) {
      mutations[getBooleanName(node)] = false
    }
  }

  return mutations
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const chatroom = String(url.searchParams.get('chatroom') ?? '')
    const startId = Number(url.searchParams.get('startId'))
    const language = normalizeLanguage(url.searchParams.get('language'))
    const appLocale = (routing.locales as readonly string[]).includes(language)
      ? (language as (typeof routing.locales)[number])
      : routing.defaultLocale
    const t = await getTranslations({
      locale: appLocale,
      namespace: 'kim.chatroom',
    })

    if (!chatroom || !Number.isInteger(startId)) {
      return NextResponse.json(
        { error: 'chatroom and startId are required.' },
        { status: 400 }
      )
    }

    const source = CHATROOM_SOURCE_BY_ID[chatroom]
    if (!source) {
      return NextResponse.json({ error: 'Unknown chatroom.' }, { status: 400 })
    }

    const [nodes, dictionary] = await Promise.all([
      loadNodes(source),
      loadDictionary(getKIMDictionarySource(language)).catch(
        () => new Map<string, string>()
      ),
    ])

    const byId = new Map<number, DialogueNode>(
      nodes.map((node) => [node.Id, node])
    )
    const startNodes = resolveStartNodes(nodes)
    const startNode = startNodes.find((node) => node.Id === startId)

    if (!startNode) {
      return NextResponse.json(
        { error: 'Selected conversation was not found.' },
        { status: 404 }
      )
    }

    const resolveText = (value: string) => resolveContent(value, dictionary)

    const booleans = parseRecordParam<boolean>(url.searchParams.get('booleans'))
    const counters = parseRecordParam<number>(url.searchParams.get('counters'))

    const results = await explorePaths({
      byId,
      node: startNode,
      maxDepth: 100,
      maxPaths: 5000,
      resolveText,
      askBooleanDecision: async (node, booleanName) => {
        if (Object.prototype.hasOwnProperty.call(booleans, booleanName)) {
          return Boolean(booleans[booleanName])
        }
        return true
      },
      askCounterBranch: async (node) => {
        const counterName = getCounterName(node)
        const value = Number(counters[counterName] ?? 0)
        const outputs = node.Outputs ?? []

        if (outputs.length === 0) {
          return unique(node.Outgoing ?? [])
        }

        const matched = outputs.filter((item) =>
          evaluateCounterOutput(item, value)
        )
        const selected =
          matched[0] ??
          outputs.find(
            (item) => item.Expression?.trim().toLowerCase() === 'false'
          )

        return unique(selected?.Outgoing ?? [])
      },
    })

    if (results.length === 0) {
      return NextResponse.json({ options: [] })
    }

    // Group results by flirting state so each relationship decision
    // (dating vs. no dating) gets its own ranked options
    const flirtingGroups = new Map<string, typeof results>()
    for (const result of results) {
      const sig = getFlirtingPathSignature(result, byId)
      const group = flirtingGroups.get(sig) ?? []
      group.push(result)
      flirtingGroups.set(sig, group)
    }

    const hasMultipleFlirtingStates = flirtingGroups.size > 1

    function flirtingLabel(sig: string): string {
      if (sig === 'no-flirting') return t('flirtingNoFlirting')
      // Extract the boolean name(s) from the signature (e.g. 'flirting:LettieFlirt')
      const names = sig.replace('flirting:', '').split('|').join(', ')
      return t('flirtingWith', { names })
    }

    const candidates: { label: string; result: (typeof results)[0] }[] = []

    for (const [sig, groupResults] of flirtingGroups) {
      const ranked = summarizeResults(groupResults)
      const suffix = hasMultipleFlirtingStates ? ` (${flirtingLabel(sig)})` : ''

      candidates.push({
        label: `${t('bestChemistryPath')}${suffix}`,
        result: ranked.byChemistry,
      })
      if (ranked.byThermostat) {
        candidates.push({
          label: `${t('bestThermostatPath')}${suffix}`,
          result: ranked.byThermostat,
        })
      }

      const distinctBooleanTieResults = [
        ...new Map(
          ranked.byBooleansTies.map((result) => [
            booleanMutationSignature(getBooleanMutationsFromPath(result, byId)),
            result,
          ])
        ).values(),
      ]

      distinctBooleanTieResults.forEach((result, index) => {
        const tieSuffix =
          distinctBooleanTieResults.length > 1 ? ` #${index + 1}` : ''

        // Only add "Most boolean activations" if there are actually activations
        if (result.activatedBooleans > 0) {
          candidates.push({
            label: `${t('mostBooleanActivations')}${tieSuffix}${suffix}`,
            result,
          })
        }
      })
      candidates.push({
        label: `${t('bestOverallPath')}${suffix}`,
        result: ranked.byOverall,
      })
    }

    const normalizedCandidates = candidates.map((candidate) => ({
      ...candidate,
      result: {
        ...candidate.result,
        booleanMutations: getBooleanMutationsFromPath(candidate.result, byId),
      },
    }))

    const options = buildPreferredPathOptions(normalizedCandidates).map(
      (option, index) => ({
        id: `${index + 1}`,
        label: option.label,
        metrics: formatPathMetrics(option.result),
        // path: option.result.path,
        chemistry: option.result.chemistry,
        thermostat: option.result.thermostat,
        activatedBooleans: option.result.activatedBooleans,
        booleanMutations: option.result.booleanMutations,
        chatLines: formatPathAsChat(
          option.result,
          byId,
          sourceLabel(source),
          resolveText
        ),
      })
    )

    return NextResponse.json({
      conversationName: getConversationName(source, startNode),
      options,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Simulation failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function parseRecordParam<T>(raw: string | null): Record<string, T> {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return parsed as Record<string, T>
  } catch {
    return {}
  }
}
