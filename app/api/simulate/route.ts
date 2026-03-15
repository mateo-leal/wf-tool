import { NextResponse } from 'next/server'
import {
  buildPreferredPathOptions,
  DEFAULT_DICT_SOURCE,
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
import { type DialogueNode } from '@/lib/types'

type SimulateRequestBody = {
  chatroom?: string
  startId?: number
  booleans?: Record<string, boolean>
  counters?: Record<string, number>
}

function unique(values: number[]): number[] {
  return [...new Set(values)]
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SimulateRequestBody
    const chatroom = String(body.chatroom ?? '')
    const startId = Number(body.startId)

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
      loadDictionary(DEFAULT_DICT_SOURCE).catch(
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

    const booleans = body.booleans ?? {}
    const counters = body.counters ?? {}

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
