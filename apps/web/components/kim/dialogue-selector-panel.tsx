'use client'

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
import {
  BOOLEANS_STORAGE_KEY,
  CHEMISTRY_STORAGE_KEY,
  COMPLETED_DIALOGUES_CHANGE_EVENT,
  COMPLETED_DIALOGUES_STORAGE_KEY,
  COUNTERS_STORAGE_KEY,
} from '@/lib/constants'
import { Type } from '@/lib/types'
import { useLocale, useTranslations } from 'next-intl'

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

function loadCountersFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COUNTERS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const result: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const numeric = Number(value)
      if (Number.isFinite(numeric)) {
        result[key] = numeric
      }
    }

    return result
  } catch {
    return {}
  }
}

function saveCountersToStorage(counters: Record<string, number>): void {
  try {
    const current = loadCountersFromStorage()
    localStorage.setItem(
      COUNTERS_STORAGE_KEY,
      JSON.stringify({ ...current, ...counters })
    )
  } catch {
    // ignore storage errors
  }
}

function loadChemistryByChatroomFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CHEMISTRY_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const result: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const numeric = Number(value)
      if (key.trim().length > 0 && Number.isFinite(numeric)) {
        result[key] = numeric
      }
    }

    return result
  } catch {
    return {}
  }
}

function loadChemistryFromStorage(chatroom: string): number {
  const byChatroom = loadChemistryByChatroomFromStorage()
  const value = byChatroom[chatroom]
  return Number.isFinite(value) ? value : 0
}

function saveChemistryByChatroomToStorage(
  chemistryByChatroom: Record<string, number>
): void {
  try {
    localStorage.setItem(
      CHEMISTRY_STORAGE_KEY,
      JSON.stringify(chemistryByChatroom)
    )
  } catch {
    // ignore storage errors
  }
}

function saveChemistryToStorage(chatroom: string, value: number): void {
  try {
    const current = loadChemistryByChatroomFromStorage()
    saveChemistryByChatroomToStorage({
      ...current,
      [chatroom]: value,
    })
  } catch {
    // ignore storage errors
  }
}

function setCounterValueByName(
  counters: Record<string, number>,
  name: string,
  value: number
): Record<string, number> {
  const existingKey = Object.keys(counters).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  )

  if (existingKey) {
    return {
      ...counters,
      [existingKey]: value,
    }
  }

  return {
    ...counters,
    [name]: value,
  }
}

function applyCounterDeltasFromConversation(
  counters: Record<string, number>,
  chatLines: PreferredPathOption['chatLines']
): Record<string, number> {
  const next = { ...counters }

  for (const line of chatLines) {
    if (line.type !== Type.IncCounterDialogueNode) {
      continue
    }

    const content = String(line.content ?? '').trim()
    const match = content.match(/^(.+?)\s+([+-]?\d+)$/)
    if (!match) {
      continue
    }

    const rawName = match[1]?.trim()
    const delta = Number(match[2])
    if (!rawName || !Number.isFinite(delta)) {
      continue
    }

    // Thermostat is applied separately from the summarized path metric.
    if (rawName.toLowerCase() === 'thermostat') {
      continue
    }

    const existingKey = Object.keys(next).find(
      (key) => key.toLowerCase() === rawName.toLowerCase()
    )
    const targetKey = existingKey ?? rawName
    const previousValue = Number(next[targetKey] ?? 0)
    next[targetKey] = previousValue + delta
  }

  return next
}

function markDialogueAsCompleted(codename: string): void {
  try {
    const raw = localStorage.getItem(COMPLETED_DIALOGUES_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : {}
    const current =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, boolean>)
        : {}

    localStorage.setItem(
      COMPLETED_DIALOGUES_STORAGE_KEY,
      JSON.stringify({
        ...current,
        [codename]: true,
      })
    )
    window.dispatchEvent(new Event(COMPLETED_DIALOGUES_CHANGE_EVENT))
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
  const locale = useLocale()
  const t = useTranslations('kim.chatroom')
  const [options, setOptions] = useState<DialogueOption[]>(dialogueOptions)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [selectedStartId, setSelectedStartId] = useState<number | null>(
    dialogueOptions[0]?.id ?? null
  )

  const selectedOption = useMemo(
    () => options.find((item) => item.id === selectedStartId),
    [options, selectedStartId]
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
  const [optionsRefreshToken, setOptionsRefreshToken] = useState(0)

  useEffect(() => {
    setPreferredPaths([])
    setSelectedPreferredPathId(null)
    setShowConversation(false)
    setSimulateError(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setIsLoadingOptions(true)
    const storedBooleans = loadBooleansFromStorage()
    const params = new URLSearchParams({
      chatroom,
      language: locale,
      booleans: JSON.stringify(storedBooleans),
    })

    fetch(`/api/dialogues?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { options?: DialogueOption[] }) => {
        if (cancelled) return
        const newOptions = data.options ?? []
        setOptions(newOptions)
        setSelectedStartId((current) => {
          const stillExists = newOptions.some((o) => o.id === current)
          return stillExists ? current : (newOptions[0]?.id ?? null)
        })
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        // Keep existing options on error.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [locale, chatroom, optionsRefreshToken])

  useEffect(() => {
    if (!requirements) {
      setBooleanValues({})
      setCounterValues({})
      return
    }

    const storedBooleans = loadBooleansFromStorage()
    const storedCounters = loadCountersFromStorage()
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
        requirements.counters.map((counter) => {
          const fromCounters = Object.entries(storedCounters).find(
            ([name]) => name.toLowerCase() === counter.name.toLowerCase()
          )?.[1]
          const counterValue = Number(fromCounters)
          if (Number.isFinite(counterValue)) {
            return [counter.name, counterValue]
          }

          return [counter.name, 0]
        })
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
        language: locale,
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
        dialogueOptions={options}
        selectedStartId={selectedStartId}
        onSelect={setSelectedStartId}
        isLoading={isLoadingOptions}
      />

      <section className="min-h-0 border border-muted-primary p-3 h-full overflow-y-auto">
        {selectedOption && requirements ? (
          <div className="space-y-3 text-foreground">
            <p className="font-title text-xl text-primary">
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
                onConfirmBooleanUpdate={() => {
                  const selected = preferredPaths.find(
                    (p) => p.id === selectedPreferredPathId
                  )
                  if (selected) {
                    saveBooleansToStorage(selected.booleanMutations)

                    const counterUpdates = applyCounterDeltasFromConversation(
                      counterValues,
                      selected.chatLines
                    )

                    const thermostatInputKey = Object.keys(counterValues).find(
                      (name) => name.toLowerCase() === 'thermostat'
                    )
                    const thermostatStart = Number(
                      thermostatInputKey ? counterValues[thermostatInputKey] : 0
                    )
                    const nextThermostat = thermostatStart + selected.thermostat

                    const withThermostat = setCounterValueByName(
                      counterUpdates,
                      'Thermostat',
                      nextThermostat
                    )

                    saveCountersToStorage(withThermostat)

                    const currentChemistry = loadChemistryFromStorage(chatroom)
                    const nextChemistry = currentChemistry + selected.chemistry
                    saveChemistryToStorage(chatroom, nextChemistry)

                    markDialogueAsCompleted(selectedOption.codename)

                    setBooleanValues((current) => ({
                      ...current,
                      ...selected.booleanMutations,
                    }))
                    setCounterValues(withThermostat)
                    setOptionsRefreshToken((current) => current + 1)
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
                  setCounterValues((current) => {
                    const next = {
                      ...current,
                      [name]: value,
                    }
                    saveCountersToStorage({ [name]: value })
                    return next
                  })
                }
                onSubmit={() => {
                  void handleSimulate()
                }}
              />
            )}

            {simulateError ? (
              <p className="border border-error-border bg-error-bg px-2 py-1 text-sm text-error">
                {simulateError}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-foreground">
            No start dialogues found for this chatroom.
          </p>
        )}
      </section>
    </>
  )
}
