import { NextResponse } from 'next/server'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/chatrooms'
import { getDictionarySource, normalizeLanguage } from '@/lib/language'
import { type DialogueNode, Type } from '@/lib/types'
import {
  getConversationName,
  resolveContent,
  resolveStartNodes,
} from '@/lib/core/node-utils'
import { loadDictionary, loadNodes } from '@/lib/core/loader'

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
  return [
    ...(node.Outgoing ?? []),
    ...(node.TrueNodes ?? []),
    ...(node.FalseNodes ?? []),
    ...outputIds,
  ]
}

function findFirstDialoguePreview(
  startId: number,
  byId: Map<number, DialogueNode>,
  dictionary: Map<string, string>
): string | null {
  const visited = new Set<number>()
  const queue: number[] = [startId]

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (typeof currentId !== 'number' || visited.has(currentId)) continue

    visited.add(currentId)
    const node = byId.get(currentId)
    if (!node) continue

    if (!NON_DIALOGUE_PREVIEW_TYPES.has(node.type)) {
      const content = node.Content?.trim()
      if (content) {
        return resolveContent(content, dictionary)
      }
    }

    for (const nextId of getNextNodeIds(node)) {
      if (!visited.has(nextId)) queue.push(nextId)
    }
  }

  return null
}

function buildConversationLabel(
  source: string,
  startNode: DialogueNode,
  byId: Map<number, DialogueNode>,
  dictionary: Map<string, string>
): string {
  const branchIds = startNode.Outgoing ?? []
  const previews =
    branchIds.length > 0
      ? branchIds
          .map((branchId) =>
            findFirstDialoguePreview(branchId, byId, dictionary)
          )
          .filter((value): value is string => Boolean(value))
      : []

  const uniquePreviews = [...new Set(previews)]
  return uniquePreviews.length > 0
    ? uniquePreviews.join(' / ')
    : getConversationName(source, startNode)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const chatroom = String(url.searchParams.get('chatroom') ?? '')
    const language = normalizeLanguage(url.searchParams.get('language'))

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
      loadDictionary(getDictionarySource(language)).catch(
        () => new Map<string, string>()
      ),
    ])

    const byId = new Map<number, DialogueNode>(
      nodes.map((node) => [node.Id, node])
    )
    const startNodes = resolveStartNodes(nodes)

    const options = startNodes.map((startNode, index) => ({
      option: index + 1,
      id: startNode.Id,
      label: buildConversationLabel(source, startNode, byId, dictionary),
      codename: getConversationName(source, startNode),
    }))

    return NextResponse.json({ options })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load dialogues.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
