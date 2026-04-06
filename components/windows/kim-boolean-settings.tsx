'use client'

import {
  BOOLEANS_STORAGE_KEY,
  COMPLETED_DIALOGUES_CHANGE_EVENT,
  COMPLETED_DIALOGUES_STORAGE_KEY,
  COUNTERS_STORAGE_KEY,
} from '@/lib/constants'
import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseButton } from '../close-button'
import { cn } from '@/lib/utils'
import { TextInput } from '../ui/text-input'
import { WindowContent } from '../ui/window-content'
import { Window } from '../ui/window'
import { WindowTitlebar } from '../ui/window-titlebar'
import { Button } from '../ui/button'
import { useTranslations } from 'next-intl'

type BooleanState = Record<string, boolean>
type CounterState = Record<string, number>
type CompletedDialoguesState = Record<string, boolean>

function loadBooleanState(): BooleanState {
  try {
    const raw = localStorage.getItem(BOOLEANS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([key]) => key.trim().length > 0)
        .map(([key, value]) => [key, Boolean(value)])
    )
  } catch {
    return {}
  }
}

function saveBooleanState(state: BooleanState): void {
  try {
    localStorage.setItem(BOOLEANS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

function loadCounterState(): CounterState {
  try {
    const raw = localStorage.getItem(COUNTERS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([key]) => key.trim().length > 0)
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value))
    )
  } catch {
    return {}
  }
}

function saveCounterState(state: CounterState): void {
  try {
    localStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

function loadCompletedDialoguesState(): CompletedDialoguesState {
  try {
    const raw = localStorage.getItem(COMPLETED_DIALOGUES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([key]) => key.trim().length > 0)
        .map(([key, value]) => [key, Boolean(value)])
    )
  } catch {
    return {}
  }
}

function saveCompletedDialoguesState(state: CompletedDialoguesState): void {
  try {
    localStorage.setItem(COMPLETED_DIALOGUES_STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new Event(COMPLETED_DIALOGUES_CHANGE_EVENT))
  } catch {
    // ignore storage errors
  }
}

export function KimBooleanSettings() {
  const t = useTranslations('kim')
  const [isOpen, setIsOpen] = useState(false)
  const [booleanState, setBooleanState] = useState<BooleanState>({})
  const [counterState, setCounterState] = useState<CounterState>({})
  const [completedDialoguesState, setCompletedDialoguesState] =
    useState<CompletedDialoguesState>({})
  const [newBooleanName, setNewBooleanName] = useState('')
  const [newCounterName, setNewCounterName] = useState('')
  const [newCounterValue, setNewCounterValue] = useState('0')
  const [newCompletedDialogueCodename, setNewCompletedDialogueCodename] =
    useState('')

  const booleanEntries = useMemo(
    () =>
      Object.entries(booleanState).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      ),
    [booleanState]
  )

  const counterEntries = useMemo(
    () =>
      Object.entries(counterState).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      ),
    [counterState]
  )

  const completedDialogueEntries = useMemo(
    () =>
      Object.entries(completedDialoguesState).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      ),
    [completedDialoguesState]
  )

  function openSettings() {
    setBooleanState(loadBooleanState())
    setCounterState(loadCounterState())
    setCompletedDialoguesState(loadCompletedDialoguesState())
    setIsOpen(true)
  }

  function updateBooleanState(next: BooleanState) {
    setBooleanState(next)
    saveBooleanState(next)
  }

  function updateCounterState(next: CounterState) {
    setCounterState(next)
    saveCounterState(next)
  }

  function updateCompletedDialoguesState(next: CompletedDialoguesState) {
    setCompletedDialoguesState(next)
    saveCompletedDialoguesState(next)
  }

  function addBoolean() {
    const name = newBooleanName.trim()
    if (!name) return
    if (Object.prototype.hasOwnProperty.call(booleanState, name)) return

    updateBooleanState({ ...booleanState, [name]: true })
    setNewBooleanName('')
  }

  function removeBoolean(name: string) {
    const next = { ...booleanState }
    delete next[name]
    updateBooleanState(next)
  }

  function setBoolean(name: string, value: boolean) {
    updateBooleanState({ ...booleanState, [name]: value })
  }

  function addCounter() {
    const name = newCounterName.trim()
    const value = Number(newCounterValue)
    if (!name || !Number.isFinite(value)) return

    updateCounterState({ ...counterState, [name]: value })
    setNewCounterName('')
    setNewCounterValue('0')
  }

  function removeCounter(name: string) {
    const next = { ...counterState }
    delete next[name]
    updateCounterState(next)
  }

  function setCounter(name: string, value: number) {
    if (!Number.isFinite(value)) return
    updateCounterState({ ...counterState, [name]: value })
  }

  function addCompletedDialogue() {
    const codename = newCompletedDialogueCodename.trim()
    if (!codename) return

    updateCompletedDialoguesState({
      ...completedDialoguesState,
      [codename]: true,
    })
    setNewCompletedDialogueCodename('')
  }

  function removeCompletedDialogue(codename: string) {
    const next = { ...completedDialoguesState }
    delete next[codename]
    updateCompletedDialoguesState(next)
  }

  function setCompletedDialogue(codename: string, completed: boolean) {
    updateCompletedDialoguesState({
      ...completedDialoguesState,
      [codename]: completed,
    })
  }

  return (
    <>
      <button
        type="button"
        aria-label={t('settings.openSettings')}
        onClick={openSettings}
        className={cn(
          'inline-flex size-7 items-center justify-center px-1 text-sm leading-none',
          'border border-primary bg-accent text-primary hover:bg-accent-hover transition'
        )}
      >
        <GearSixIcon className="size-4" weight="bold" />
      </button>

      {isOpen
        ? createPortal(
            <section className="fixed inset-0 z-50 flex items-center justify-center p-3">
              <Window className="h-[min(88svh,900px)] max-w-[min(96vw,1400px)] md:h-[min(72svh,720px)] md:max-w-[min(80vw,1000px)]">
                <WindowTitlebar>
                  <p>{t('settings.title')}</p>
                  <CloseButton
                    onClick={() => setIsOpen(false)}
                    label={t('settings.close')}
                  />
                </WindowTitlebar>

                <WindowContent>
                  <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-3">
                    <section className="flex min-h-0 flex-col border border-muted-primary bg-background p-2">
                      <p className="mb-2 font-title text-base text-primary">
                        {t('settings.booleans')}
                      </p>
                      <div className="flex gap-2 border border-muted-primary bg-background p-2">
                        <TextInput
                          id="boolean-name-input"
                          value={newBooleanName}
                          onChange={(event) =>
                            setNewBooleanName(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addBoolean()
                            }
                          }}
                          placeholder={t('settings.booleanName')}
                        />
                        <Button className="shrink-0" onClick={addBoolean}>
                          <PlusIcon size={14} weight="bold" />
                          {t('settings.actions.add')}
                        </Button>
                      </div>

                      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                        {booleanEntries.length === 0 ? (
                          <p className="text-sm text-foreground">
                            {t('settings.noBooleansSaved')}
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {booleanEntries.map(([name, value]) => (
                              <li
                                key={name}
                                className="border border-muted-primary bg-background p-2"
                              >
                                <p className="text-sm text-foreground break-all">
                                  {name}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <Button
                                    variant={value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setBoolean(name, true)}
                                  >
                                    {t('settings.actions.activate')}
                                  </Button>
                                  <Button
                                    variant={!value ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => setBoolean(name, false)}
                                  >
                                    {t('settings.actions.deactivate')}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeBoolean(name)}
                                  >
                                    <TrashIcon size={12} weight="bold" />
                                    {t('settings.actions.remove')}
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>

                    <section className="flex min-h-0 flex-col border border-muted-primary bg-background p-2">
                      <p className="mb-2 font-title text-base text-primary">
                        {t('settings.counters')}
                      </p>
                      <div className="flex gap-2 border border-muted-primary bg-background p-2">
                        <TextInput
                          id="counter-name-input"
                          value={newCounterName}
                          onChange={(event) =>
                            setNewCounterName(event.target.value)
                          }
                          placeholder={t('settings.counterName')}
                        />
                        <TextInput
                          id="counter-value-input"
                          value={newCounterValue}
                          onChange={(event) =>
                            setNewCounterValue(event.target.value)
                          }
                          placeholder="0"
                        />
                        <Button className="shrink-0" onClick={addCounter}>
                          <PlusIcon size={14} weight="bold" />
                          {t('settings.actions.add')}
                        </Button>
                      </div>

                      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                        {counterEntries.length === 0 ? (
                          <p className="text-sm text-foreground">
                            {t('settings.noCountersSaved')}
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {counterEntries.map(([name, value]) => (
                              <li
                                key={name}
                                className="border border-muted-primary bg-background p-2"
                              >
                                <p className="text-sm text-foreground break-all">
                                  {name}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  <TextInput
                                    id={`counter-${name}`}
                                    value={String(value)}
                                    onChange={(event) => {
                                      const numeric = Number(event.target.value)
                                      if (Number.isFinite(numeric)) {
                                        setCounter(name, numeric)
                                      }
                                    }}
                                    placeholder="0"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeCounter(name)}
                                  >
                                    <TrashIcon size={12} weight="bold" />
                                    {t('settings.actions.remove')}
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>

                    <section className="flex min-h-0 flex-col border border-muted-primary bg-background p-2">
                      <p className="mb-2 font-title text-base text-primary">
                        {t('settings.completedDialogues')}
                      </p>
                      <div className="flex gap-2 border border-muted-primary bg-background p-2">
                        <TextInput
                          id="completed-dialogue-input"
                          value={newCompletedDialogueCodename}
                          onChange={(event) =>
                            setNewCompletedDialogueCodename(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addCompletedDialogue()
                            }
                          }}
                          placeholder={t('settings.dialogueCodename')}
                        />
                        <Button
                          className="shrink-0"
                          onClick={addCompletedDialogue}
                        >
                          <PlusIcon size={14} weight="bold" />
                          {t('settings.actions.add')}
                        </Button>
                      </div>

                      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                        {completedDialogueEntries.length === 0 ? (
                          <p className="text-sm text-foreground">
                            {t('settings.noCompletedDialoguesSaved')}
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {completedDialogueEntries.map(
                              ([codename, value]) => (
                                <li
                                  key={codename}
                                  className="border border-muted-primary bg-background p-2"
                                >
                                  <p className="text-sm text-foreground break-all">
                                    {codename}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    <Button
                                      variant={value ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() =>
                                        setCompletedDialogue(codename, true)
                                      }
                                    >
                                      {t('settings.actions.completed')}
                                    </Button>
                                    <Button
                                      variant={
                                        !value ? 'destructive' : 'outline'
                                      }
                                      size="sm"
                                      onClick={() =>
                                        setCompletedDialogue(codename, false)
                                      }
                                    >
                                      {t('settings.actions.notCompleted')}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        removeCompletedDialogue(codename)
                                      }
                                    >
                                      <TrashIcon size={12} weight="bold" />
                                      {t('settings.actions.remove')}
                                    </Button>
                                  </div>
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    </section>
                  </div>
                </WindowContent>
              </Window>
            </section>,
            document.body
          )
        : null}
    </>
  )
}
