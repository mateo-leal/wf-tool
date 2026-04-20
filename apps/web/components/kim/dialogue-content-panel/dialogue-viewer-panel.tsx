import { useTranslations } from 'next-intl'
import { DialoguePath, Node } from '@tenno-companion/kim/types'
import { NodeType } from '@tenno-companion/kim/constants'

import { Button } from '@/components/ui/button'

import { ChatLine } from './chat-line'
import { SystemChatLine } from './system-chat-line'
import { useState, useTransition } from 'react'
import { useKIMChat } from '@/components/providers/kim-chat'

function isDialogueNode(node: Node) {
  return node.type === NodeType.Dialogue || node.type === NodeType.PlayerChoice
}

type Props = {
  dialoguePath: DialoguePath
}

export function DialogueViewerPanel({ dialoguePath }: Props) {
  const t = useTranslations()
  const {
    chatroom,
    updateBooleans,
    updateChemistry,
    updateCompletedDialogue,
    updateCounters,
  } = useKIMChat()
  const [isPending, startTransition] = useTransition()
  const [showBooleanUpdateNotice, setShowBooleanUpdateNotice] = useState(false)

  const handleUpdateGameState = () => {
    startTransition(() => {
      updateBooleans(dialoguePath.finalState.booleans)
      updateChemistry(chatroom, dialoguePath.mutations.chemistry)
      updateCounters(dialoguePath.finalState.counters)

      const startNode = dialoguePath.nodes.find(
        (node) => node.type === NodeType.Start
      )

      if (startNode) {
        const nodes = dialoguePath.nodes.map((node) => node.Id)
        updateCompletedDialogue(startNode.Content, nodes)
      }
      setShowBooleanUpdateNotice(true)
    })
  }

  return (
    <div className="border border-[#6b4820] bg-[#120e08] p-2 space-y-3">
      {dialoguePath.nodes.length > 0 ? (
        <ul className="space-y-1 bg-[#0f0a06] text-sm text-[#ddd7c9]">
          {dialoguePath.nodes.map((node, index) => (
            <li key={`${node.Id}-${index}`}>
              {isDialogueNode(node) ? (
                <ChatLine node={node} />
              ) : (
                <SystemChatLine node={node} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#b9ac8f]">
          {t('kim.chatroom.noDialogueTextAvailable')}
        </p>
      )}

      {showBooleanUpdateNotice ? (
        <p className="border border-success-border bg-success-bg px-2 py-1 text-sm text-success">
          {t('kim.chatroom.booleanUpdated')}
        </p>
      ) : null}

      {showBooleanUpdateNotice ? (
        <p className="text-center text-xs text-[#b9ac8f]">
          {t('kim.chatroom.futureSimulationsNotice')}
        </p>
      ) : (
        <Button
          variant="default"
          size="lg"
          className="w-full"
          onClick={handleUpdateGameState}
          disabled={isPending}
        >
          {isPending ? t('ui.loading') : t('kim.chatroom.updateBooleanValues')}
        </Button>
      )}
    </div>
  )
}
