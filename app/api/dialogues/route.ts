import { NextResponse } from 'next/server'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/kim/chatrooms'
import { getKIMDictionarySource, normalizeLanguage } from '@/lib/language'
import { type DialogueNode, Type } from '@/lib/types'
import {
  getConversationName,
  getBooleanName,
  resolveContent,
  resolveStartNodes,
} from '@/lib/kim/node-utils'
import { loadDictionary, loadNodes } from '@/lib/kim/loader'

const NON_DIALOGUE_PREVIEW_TYPES = new Set<Type>([
  Type.StartDialogueNode,
  Type.CheckBooleanDialogueNode,
  Type.CheckBooleanScriptDialogueNode,
  Type.CheckCounterDialogueNode,
  Type.CheckMultiBooleanDialogueNode,
  Type.SetBooleanDialogueNode,
  Type.ResetBooleanDialogueNode,
  Type.IncCounterDialogueNode,
  Type.EndDialogueNode,
  Type.SpecialCompletionDialogueNode,
])

function getNextNodeIds(node: DialogueNode): number[] {
  const outputIds = (node.Outputs ?? []).flatMap((o) => o.Outgoing ?? [])
  return [...(node.Outgoing ?? []), ...outputIds]
}

function getNextNodeIdsForBooleans(
  node: DialogueNode,
  booleans: Record<string, boolean>
): number[] {
  if (
    node.type === Type.CheckBooleanDialogueNode ||
    node.type === Type.CheckBooleanScriptDialogueNode
  ) {
    const name = getBooleanName(node)
    const isTrue = Boolean(booleans[name])
    return isTrue ? (node.TrueNodes ?? []) : (node.FalseNodes ?? [])
  }

  if (node.type === Type.CheckMultiBooleanDialogueNode) {
    const outputs = node.Outputs ?? []
    let fallback: number[] | undefined

    for (const output of outputs) {
      const expression = output.Expression?.trim()
      if (!expression) {
        continue
      }

      if (expression.toLowerCase() === 'false') {
        fallback = output.Outgoing ?? []
        continue
      }

      if (Boolean(booleans[expression])) {
        return output.Outgoing ?? []
      }
    }

    return fallback ?? node.FalseNodes ?? node.Outgoing ?? []
  }

  return getNextNodeIds(node)
}

function collectDialoguePreviews(
  startId: number,
  byId: Map<number, DialogueNode>,
  dictionary: Map<string, string>,
  booleans: Record<string, boolean>
): string[] {
  const visited = new Set<number>()
  const queue: number[] = [startId]
  const previews: string[] = []
  const seenPreviews = new Set<string>()

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (typeof currentId !== 'number' || visited.has(currentId)) continue

    visited.add(currentId)
    const node = byId.get(currentId)
    if (!node) continue

    if (!NON_DIALOGUE_PREVIEW_TYPES.has(node.type)) {
      const content = node.Content?.trim()
      if (content) {
        const resolved = resolveContent(content, dictionary)
        if (!seenPreviews.has(resolved)) {
          seenPreviews.add(resolved)
          previews.push(resolved)
        }
      }

      // Stop expanding this branch once we hit the first dialogue node.
      continue
    }

    for (const nextId of getNextNodeIdsForBooleans(node, booleans)) {
      if (!visited.has(nextId)) queue.push(nextId)
    }
  }

  return previews
}

function buildConversationLabel(
  source: string,
  startNode: DialogueNode,
  byId: Map<number, DialogueNode>,
  dictionary: Map<string, string>,
  booleans: Record<string, boolean>
): string {
  const previews = collectDialoguePreviews(
    startNode.Id,
    byId,
    dictionary,
    booleans
  )

  return previews.length > 0
    ? previews.join(' / ')
    : getConversationName(source, startNode)
}

function hasReachableDialoguePreview(
  startNode: DialogueNode,
  byId: Map<number, DialogueNode>,
  dictionary: Map<string, string>,
  booleans: Record<string, boolean>
): boolean {
  return (
    collectDialoguePreviews(startNode.Id, byId, dictionary, booleans).length > 0
  )
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const chatroom = String(url.searchParams.get('chatroom') ?? '')
    const language = normalizeLanguage(url.searchParams.get('language'))
    const booleans = parseRecordParam<boolean>(url.searchParams.get('booleans'))

    if (!chatroom) {
      return NextResponse.json(
        { error: 'chatroom is required.' },
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
    const reachableStartNodes = startNodes.filter((startNode) =>
      hasReachableDialoguePreview(startNode, byId, dictionary, booleans)
    )

    const options = reachableStartNodes.map((startNode, index) => ({
      option: index + 1,
      id: startNode.Id,
      label: buildConversationLabel(
        source,
        startNode,
        byId,
        dictionary,
        booleans
      ),
      codename: getConversationName(source, startNode),
    }))

    return NextResponse.json({ options })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load dialogues.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
