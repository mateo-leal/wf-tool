'use client'

import { CATHEDRALE_CHATROOMS, HEX_CHATROOMS } from '@/lib/chatrooms'
import { useEffect, useMemo, useState } from 'react'
import { DialogueOptionsList } from './dialogue-selector-panel/dialogue-options-list'
import { SimulationLoadingState } from './dialogue-selector-panel/loading-state'
import { PreferredPathPanel } from './dialogue-selector-panel/preferred-path-panel'
import { SimulationForm } from './dialogue-selector-panel/simulation-form'
import {
  type DialogueOption,
  type PreferredPathOption,
  type SimulationRequirements,
} from './dialogue-selector-panel/types'

type DialogueSelectorPanelProps = {
  chatroom: string
  dialogueOptions: DialogueOption[]
  requirementsByStartId: Record<string, SimulationRequirements>
}

export function DialogueSelectorPanel({
  chatroom,
  dialogueOptions,
  requirementsByStartId,
}: DialogueSelectorPanelProps) {
  const [selectedStartId, setSelectedStartId] = useState<number | null>(
    dialogueOptions[0]?.id ?? null
  )

  const selectedOption = useMemo(
    () => dialogueOptions.find((item) => item.id === selectedStartId),
    [dialogueOptions, selectedStartId]
  )

  const requirements =
    selectedStartId !== null
      ? requirementsByStartId[String(selectedStartId)]
      : undefined

  const [booleanValues, setBooleanValues] = useState<Record<string, boolean>>(
    {}
  )
  const [counterValues, setCounterValues] = useState<Record<string, number>>({})
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulateError, setSimulateError] = useState<string | null>(null)
  const [preferredPaths, setPreferredPaths] = useState<PreferredPathOption[]>(
    []
  )
  const [selectedPreferredPathId, setSelectedPreferredPathId] = useState<
    string | null
  >(null)
  const [showConversation, setShowConversation] = useState(false)

  const chatroomIcon = useMemo(() => {
    return (
      [...HEX_CHATROOMS, ...CATHEDRALE_CHATROOMS].find(
        (room) => room.id === chatroom.toLowerCase()
      )?.icon ?? 'https://wiki.warframe.com/images/LotusSymbolGlyph.png'
    )
  }, [chatroom])

  useEffect(() => {
    if (!requirements) {
      setBooleanValues({})
      setCounterValues({})
      return
    }

    setBooleanValues(
      Object.fromEntries(requirements.booleans.map((name) => [name, true]))
    )
    setCounterValues(
      Object.fromEntries(
        requirements.counters.map((counter) => [counter.name, 0])
      )
    )
    setPreferredPaths([])
    setSelectedPreferredPathId(null)
    setShowConversation(false)
    setSimulateError(null)
  }, [requirements, selectedStartId])

  async function handleSimulate() {
    if (!selectedOption) {
      return
    }

    setIsSimulating(true)
    setSimulateError(null)
    setPreferredPaths([])
    setSelectedPreferredPathId(null)
    setShowConversation(false)

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatroom,
          startId: selectedOption.id,
          booleans: booleanValues,
          counters: counterValues,
        }),
      })

      const payload = (await response.json()) as {
        error?: string
        options?: PreferredPathOption[]
      }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Simulation request failed.')
      }

      const options = payload.options ?? []
      setPreferredPaths(options)
      setSelectedPreferredPathId(options[0]?.id ?? null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Simulation request failed.'
      setSimulateError(message)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <>
      <DialogueOptionsList
        dialogueOptions={dialogueOptions}
        selectedStartId={selectedStartId}
        onSelect={setSelectedStartId}
      />

      <section className="min-h-0 border border-[#8f5d1f] bg-black p-3 h-full overflow-y-auto">
        {selectedOption && requirements ? (
          <div className="space-y-3 text-[#ddd7c9]">
            <p className="font-title text-xl text-[#f0bb5f]">
              {selectedOption.label}
            </p>

            {isSimulating ? (
              <SimulationLoadingState />
            ) : preferredPaths.length > 0 ? (
              <PreferredPathPanel
                selectedOptionId={selectedOption.id}
                preferredPaths={preferredPaths}
                selectedPreferredPathId={selectedPreferredPathId}
                onSelectPreferredPath={setSelectedPreferredPathId}
                onShowConversation={() => setShowConversation(true)}
                showConversation={showConversation}
                chatroomIcon={chatroomIcon}
              />
            ) : (
              <SimulationForm
                selectedOptionId={selectedOption.id}
                requirements={requirements}
                booleanValues={booleanValues}
                counterValues={counterValues}
                onBooleanChange={(name, value) =>
                  setBooleanValues((current) => ({
                    ...current,
                    [name]: value,
                  }))
                }
                onCounterChange={(name, value) =>
                  setCounterValues((current) => ({
                    ...current,
                    [name]: value,
                  }))
                }
                onSubmit={() => {
                  void handleSimulate()
                }}
              />
            )}

            {simulateError ? (
              <p className="border border-[#7e2f1e] bg-[#2a0f07] px-2 py-1 text-sm text-[#f3af9f]">
                {simulateError}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[#ddd7c9]">
            No start dialogues found for this chatroom.
          </p>
        )}
      </section>
    </>
  )
}
