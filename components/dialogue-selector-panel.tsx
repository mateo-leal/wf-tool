'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  normalizeLanguage,
} from '@/lib/language'
import { DialogueOptionsList } from './dialogue-selector-panel/dialogue-options-list'
import { SimulationLoadingState } from './dialogue-selector-panel/loading-state'
import { PreferredPathPanel } from './dialogue-selector-panel/preferred-path-panel'
import { SimulationForm } from './dialogue-selector-panel/simulation-form'
import {
  type DialogueOption,
  type PreferredPathOption,
  type SimulationRequirements,
} from './dialogue-selector-panel/types'

const BOOLEANS_STORAGE_KEY = 'wf-kim:booleans'

function loadBooleansFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(BOOLEANS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}
    return parsed as Record<string, boolean>
  } catch {
    return {}
  }
}

function saveBooleansToStorage(mutations: Record<string, boolean>): void {
  try {
    const current = loadBooleansFromStorage()
    localStorage.setItem(
      BOOLEANS_STORAGE_KEY,
      JSON.stringify({ ...current, ...mutations })
    )
  } catch {
    // ignore storage errors
  }
}

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
  const [language, setLanguage] = useState(() => {
    try {
      return normalizeLanguage(localStorage.getItem('wf-kim:language'))
    } catch {
      return DEFAULT_LANGUAGE
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('wf-kim:language', language)
    } catch {
      // ignore storage errors
    }
    setPreferredPaths([])
    setSelectedPreferredPathId(null)
    setShowConversation(false)
    setSimulateError(null)
  }, [language])

  useEffect(() => {
    if (!requirements) {
      setBooleanValues({})
      setCounterValues({})
      return
    }

    const storedBooleans = loadBooleansFromStorage()
    setBooleanValues(
      Object.fromEntries(
        requirements.booleans.map((name) => [
          name,
          Object.prototype.hasOwnProperty.call(storedBooleans, name)
            ? storedBooleans[name]
            : false,
        ])
      )
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
      const params = new URLSearchParams({
        chatroom,
        startId: String(selectedOption.id),
        language,
        booleans: JSON.stringify(booleanValues),
        counters: JSON.stringify(counterValues),
      })
      const response = await fetch(`/api/simulate?${params.toString()}`)

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
            <div className="space-y-1">
              <label
                htmlFor="sim-language"
                className="block text-xs uppercase tracking-wide text-[#b9ac8f]"
              >
                Language
              </label>
              <select
                id="sim-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full border border-[#6b4820] bg-[#120e08] px-2 py-1.5 text-sm text-[#ddd7c9] outline-none focus:border-[#cfad73]"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isSimulating ? (
              <SimulationLoadingState />
            ) : preferredPaths.length > 0 ? (
              <PreferredPathPanel
                selectedOptionId={selectedOption.id}
                preferredPaths={preferredPaths}
                selectedPreferredPathId={selectedPreferredPathId}
                onSelectPreferredPath={setSelectedPreferredPathId}
                onConfirmBooleanUpdate={() => {
                  const selected = preferredPaths.find(
                    (p) => p.id === selectedPreferredPathId
                  )
                  if (selected) {
                    saveBooleansToStorage(selected.booleanMutations)
                    setBooleanValues((current) => ({
                      ...current,
                      ...selected.booleanMutations,
                    }))
                  }
                }}
                onShowConversation={() => {
                  setShowConversation(true)
                }}
                showConversation={showConversation}
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
