import { NextResponse } from 'next/server'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/chatrooms'
import { getDictionarySource, normalizeLanguage } from '@/lib/language'
import { type DialogueNode } from '@/lib/types'
import { loadDictionary, loadNodes } from '@/lib/core/loader'
import {
  getConversationName,
  getCounterName,
  resolveContent,
  resolveStartNodes,
  sourceLabel,
} from '@/lib/core/node-utils'
import { explorePaths } from '@/lib/core/explorer'
import { evaluateCounterOutput } from '@/lib/core/counter-utils'
import { getFlirtingBooleanSignature } from '@/lib/core/boolean-utils'
import { buildPreferredPathOptions, summarizeResults } from '@/lib/core/ranker'
import { formatPathAsChat, formatPathMetrics } from '@/lib/core/formatter'

function unique(values: number[]): number[] {
  return [...new Set(values)]
}

function booleanMutationSignature(mutations: Record<string, boolean>): string {
  return Object.entries(mutations)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value ? '1' : '0'}`)
    .join('|')
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const chatroom = String(url.searchParams.get('chatroom') ?? '')
    const startId = Number(url.searchParams.get('startId'))
    const language = normalizeLanguage(url.searchParams.get('language'))

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
      loadDictionary(getDictionarySource(language)).catch(
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
      const sig = getFlirtingBooleanSignature(result.booleanMutations)
      const group = flirtingGroups.get(sig) ?? []
      group.push(result)
      flirtingGroups.set(sig, group)
    }

    const hasMultipleFlirtingStates = flirtingGroups.size > 1

    function flirtingLabel(sig: string): string {
      if (sig === 'no-flirting') return 'no flirting'
      // Extract the boolean name(s) from the signature (e.g. 'flirting:LettieFlirt')
      const names = sig.replace('flirting:', '').split('|').join(', ')
      return `with ${names}`
    }

    const candidates: { label: string; result: (typeof results)[0] }[] = []

    for (const [sig, groupResults] of flirtingGroups) {
      const ranked = summarizeResults(groupResults)
      const suffix = hasMultipleFlirtingStates ? ` (${flirtingLabel(sig)})` : ''

      candidates.push({
        label: `Best chemistry path${suffix}`,
        result: ranked.byChemistry,
      })
      if (ranked.byThermostat) {
        candidates.push({
          label: `Best thermostat path${suffix}`,
          result: ranked.byThermostat,
        })
      }

      const distinctBooleanTieResults = [
        ...new Map(
          ranked.byBooleansTies.map((result) => [
            booleanMutationSignature(result.booleanMutations),
            result,
          ])
        ).values(),
      ]

      distinctBooleanTieResults.forEach((result, index) => {
        const tieSuffix =
          distinctBooleanTieResults.length > 1 ? ` #${index + 1}` : ''

        candidates.push({
          label: `Most boolean activations${tieSuffix}${suffix}`,
          result,
        })
      })
      candidates.push({
        label: `Best overall path${suffix}`,
        result: ranked.byOverall,
      })
    }

    const options = buildPreferredPathOptions(candidates).map(
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
