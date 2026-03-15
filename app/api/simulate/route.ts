import { NextResponse } from 'next/server'
import {
  buildPreferredPathOptions,
  evaluateCounterOutput,
  explorePaths,
  formatPathAsChat,
  formatPathMetrics,
  getConversationName,
  getCounterName,
  loadDictionary,
  loadNodes,
  resolveContent,
  resolveStartNodes,
  sourceLabel,
  summarizeResults,
} from '@/lib/core/pathfinder'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/chatrooms'
import { getDictionarySource, normalizeLanguage } from '@/lib/language'
import { type DialogueNode } from '@/lib/types'

function unique(values: number[]): number[] {
  return [...new Set(values)]
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

    const ranked = summarizeResults(results)
    const options = buildPreferredPathOptions([
      { label: 'Best chemistry path', result: ranked.byChemistry },
      ...(ranked.byThermostat
        ? [{ label: 'Best thermostat path', result: ranked.byThermostat }]
        : []),
      { label: 'Most boolean activations', result: ranked.byBooleans },
      { label: 'Best overall path', result: ranked.byOverall },
    ]).map((option, index) => ({
      id: `${index + 1}`,
      label: option.label,
      metrics: formatPathMetrics(option.result),
      path: option.result.path,
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
    }))

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
