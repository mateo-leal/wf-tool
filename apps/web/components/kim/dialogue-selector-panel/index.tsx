'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'

import { cn } from '@/lib/utils'

import { useKIMChat } from '../../providers/kim-chat'
import { DialogueOptionsList } from './dialogue-options-list'
import { DialogueContentPanel } from '../dialogue-content-panel'

export function DialogueSelectorPanel() {
  const [isPending, startTransition] = useTransition()
  const { simulation } = useKIMChat()

  const firstNodesContent = useMemo(
    () => simulation.findAllFirstContentNodes() ?? [],
    [simulation]
  )

  const [selectedStartId, setSelectedStartId] = useState<number | null>(null)

  useEffect(() => {
    if (selectedStartId === null && firstNodesContent.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedStartId(firstNodesContent[0].id)
    }
  }, [firstNodesContent, selectedStartId])

  const selectedOption = useMemo(
    () => firstNodesContent.find((item) => item.id === selectedStartId),
    [firstNodesContent, selectedStartId]
  )

  const handleSelectStartId = (id: number) => {
    startTransition(() => {
      setSelectedStartId(id)
    })
  }

  return (
    <>
      <DialogueOptionsList
        firstNodes={firstNodesContent}
        selectedStartId={selectedStartId}
        onSelect={handleSelectStartId}
      />

      {selectedOption && (
        <div
          className={cn({
            'opacity-70': isPending,
          })}
        >
          <DialogueContentPanel option={selectedOption} />
        </div>
      )}
    </>
  )
}
