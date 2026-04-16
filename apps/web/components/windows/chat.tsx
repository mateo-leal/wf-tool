import { DialogueSelectorPanel } from '@/components/kim/dialogue-selector-panel'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/kim/chatrooms'
import { notFound } from 'next/navigation'
import { Type, type DialogueNode } from '@/lib/types'
import { CloseButton } from '../close-button'
import { Window } from '../ui/window'
import { WindowTitlebar } from '../ui/window-titlebar'
import { WindowContent } from '../ui/window-content'
import {
  getBooleanName,
  getConversationName,
  getCounterName,
  getMultiBooleanNames,
  resolveContent,
  resolveStartNodes,
} from '@/lib/kim/node-utils'
import { loadDictionary, loadNodes } from '@/lib/kim/loader'
import { getLocale, getTranslations } from 'next-intl/server'
import { getKIMDictionarySource } from '@/lib/language'

const BOOLEAN_CHECK_TYPES = new Set<Type>([
  Type.CheckBooleanDialogueNode,
  Type.CheckBooleanScriptDialogueNode,
  Type.CheckMultiBooleanDialogueNode,
])

type SimulationRequirements = {
  booleans: string[]
  counters: Array<{
    name: string
    expressions: string[]
  }>
}

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

function collectSimulationRequirements(
  byId: Map<number, DialogueNode>,
  startId: number
): SimulationRequirements {
  const visited = new Set<number>()
  const queue: number[] = [startId]
  const booleans = new Set<string>()
  const counters = new Map<string, Set<string>>()

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (typeof currentId !== 'number' || visited.has(currentId)) {
      continue
    }

    visited.add(currentId)
    const node = byId.get(currentId)
    if (!node) {
      continue
    }

    if (node.type === Type.CheckMultiBooleanDialogueNode) {
      for (const booleanName of getMultiBooleanNames(node)) {
        booleans.add(booleanName)
      }
    } else if (BOOLEAN_CHECK_TYPES.has(node.type)) {
      booleans.add(getBooleanName(node))
    }

    if (node.type === Type.CheckCounterDialogueNode) {
      const counterName = getCounterName(node)
      const values = counters.get(counterName) ?? new Set<string>()
      for (const output of node.Outputs ?? []) {
        const expression = output.Expression?.trim()
        if (expression) {
          values.add(expression)
        }
      }
      counters.set(counterName, values)
    }

    for (const nextId of node.Outgoing ?? []) {
      if (!visited.has(nextId)) {
        queue.push(nextId)
      }
    }

    for (const nextId of node.TrueNodes ?? []) {
      if (!visited.has(nextId)) {
        queue.push(nextId)
      }
    }

    for (const nextId of node.FalseNodes ?? []) {
      if (!visited.has(nextId)) {
        queue.push(nextId)
      }
    }

    for (const output of node.Outputs ?? []) {
      for (const nextId of output.Outgoing ?? []) {
        if (!visited.has(nextId)) {
          queue.push(nextId)
        }
      }
    }
  }

  return {
    booleans: [...booleans].sort((a, b) => a.localeCompare(b)),
    counters: [...counters.entries()]
      .map(([name, expressions]) => ({
        name,
        expressions: [...expressions],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
}

function getNextNodeIds(node: DialogueNode): number[] {
  const outputIds = (node.Outputs ?? []).flatMap(
    (output) => output.Outgoing ?? []
  )

  return [
    ...(node.Outgoing ?? []),
    ...(node.TrueNodes ?? []),
    ...(node.FalseNodes ?? []),
    ...outputIds,
  ]
}

function getPreviewText(
  node: DialogueNode,
  dictionary: Map<string, string>
): string | null {
  if (NON_DIALOGUE_PREVIEW_TYPES.has(node.type)) {
    return null
  }

  const content = node.Content?.trim()
  if (!content) {
    return null
  }

  return resolveContent(content, dictionary)
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
    if (typeof currentId !== 'number' || visited.has(currentId)) {
      continue
    }

    visited.add(currentId)
    const node = byId.get(currentId)
    if (!node) {
      continue
    }

    const preview = getPreviewText(node, dictionary)
    if (preview) {
      return preview
    }

    for (const nextId of getNextNodeIds(node)) {
      if (!visited.has(nextId)) {
        queue.push(nextId)
      }
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
  if (uniquePreviews.length > 0) {
    return uniquePreviews.join(' / ')
  }

  return getConversationName(source, startNode)
}

export async function ChatWindow({ chatroom }: { chatroom: string }) {
  const locale = await getLocale()
  const t = await getTranslations('kim.chatroom')
  const source = CHATROOM_SOURCE_BY_ID[chatroom]
  const dictionarySource = getKIMDictionarySource(locale)

  if (!source) {
    notFound()
  }

  const [nodes, dictionary] = await Promise.all([
    loadNodes(source),
    loadDictionary(dictionarySource).catch(() => new Map<string, string>()),
  ])

  const startNodes = resolveStartNodes(nodes)
  const byId = new Map<number, DialogueNode>(
    nodes.map((node) => [node.Id, node])
  )

  const dialogueOptions = startNodes.map((startNode, index) => {
    const codename = getConversationName(source, startNode)
    const label = buildConversationLabel(source, startNode, byId, dictionary)

    return {
      option: index + 1,
      id: startNode.Id,
      label,
      codename,
    }
  })

  const requirementsByStartId = Object.fromEntries(
    startNodes.map((startNode) => [
      String(startNode.Id),
      collectSimulationRequirements(byId, startNode.Id),
    ])
  )

  return (
    <Window className="relative z-10 mt-0 h-[calc(100svh-5.5rem)] min-h-75 max-w-none md:mt-16 md:mr-10 md:ml-auto md:h-[65svh] md:max-w-220">
      <WindowTitlebar>
        <p className="window-title capitalize">{chatroom}</p>
        <CloseButton href="/kim" />
      </WindowTitlebar>
      <WindowContent className="sm:p-3">
        <div className="border border-muted-primary bg-background px-2 py-1 text-sm text-foreground">
          {t('selectTheDialogue', { count: dialogueOptions.length })}
        </div>

        <div className="mt-2 grid min-h-0 flex-1 gap-2 grid-rows-[minmax(170px,30svh)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[minmax(0,270px)_minmax(0,1fr)]">
          <DialogueSelectorPanel
            chatroom={chatroom}
            dialogueOptions={dialogueOptions}
            requirementsByStartId={requirementsByStartId}
          />
        </div>
      </WindowContent>
    </Window>
  )
}
