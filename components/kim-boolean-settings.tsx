'use client'

import { BOOLEANS_STORAGE_KEY } from '@/lib/constants'
import { GearSixIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseButton } from './close-button'
import { cn } from '@/lib/utils'

type BooleanState = Record<string, boolean>

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

export function KimBooleanSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [booleanState, setBooleanState] = useState<BooleanState>({})
  const [newName, setNewName] = useState('')

  const entries = useMemo(
    () =>
      Object.entries(booleanState).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      ),
    [booleanState]
  )

  function openSettings() {
    setBooleanState(loadBooleanState())
    setIsOpen(true)
  }

  function updateState(next: BooleanState) {
    setBooleanState(next)
    saveBooleanState(next)
  }

  function addBoolean() {
    const name = newName.trim()
    if (!name) return
    if (Object.prototype.hasOwnProperty.call(booleanState, name)) return

    updateState({ ...booleanState, [name]: false })
    setNewName('')
  }

  function removeBoolean(name: string) {
    const next = { ...booleanState }
    delete next[name]
    updateState(next)
  }

  function setBoolean(name: string, value: boolean) {
    updateState({ ...booleanState, [name]: value })
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open boolean settings"
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
              <div className="kim-window flex h-[min(82svh,700px)] w-full max-w-190 flex-col">
                <header className="window-titlebar">
                  <p className="window-title">Boolean settings</p>
                  <CloseButton
                    onClick={() => setIsOpen(false)}
                    label="Close boolean settings"
                  />
                </header>

                <div className="window-content flex min-h-0 flex-1 flex-col border-t border-[#8f5d1f] bg-[#060606] p-2">
                  <div className="flex gap-2 border border-[#6b4820] bg-[#120e08] p-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addBoolean()
                        }
                      }}
                      placeholder="Add boolean name"
                      className="w-full border border-[#6b4820] bg-[#120e08] px-2 py-1.5 text-sm text-[#ddd7c9] outline-none placeholder:text-[#8f7b5d] focus:border-[#cfad73]"
                    />
                    <button
                      type="button"
                      onClick={addBoolean}
                      className="inline-flex shrink-0 items-center gap-1 border border-[#7a6c2a] bg-[#1f220b] px-2 py-1 text-xs text-[#e2d57c] transition hover:bg-[#2e3311]"
                    >
                      <PlusIcon size={14} weight="bold" />
                      Add
                    </button>
                  </div>

                  <div className="mt-2 min-h-0 flex-1 overflow-y-auto border border-[#6b4820] bg-[#120e08] p-2">
                    {entries.length === 0 ? (
                      <p className="text-sm text-[#b9ac8f]">
                        No booleans saved yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {entries.map(([name, value]) => (
                          <li
                            key={name}
                            className="border border-[#3f2a11] bg-[#0f0a06] p-2"
                          >
                            <p className="text-sm text-[#f0bb5f] break-all">
                              {name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setBoolean(name, true)}
                                className={`border px-2 py-1 transition ${
                                  value
                                    ? 'border-[#3a5c1a] bg-[#0f1f07] text-[#8fd45a]'
                                    : 'border-[#6b4820] bg-[#120e08] text-[#d8ccb5] hover:bg-[#1d140c]'
                                }`}
                              >
                                Activate
                              </button>
                              <button
                                type="button"
                                onClick={() => setBoolean(name, false)}
                                className={`border px-2 py-1 transition ${
                                  !value
                                    ? 'border-[#5c1a1a] bg-[#1f0707] text-[#d45a5a]'
                                    : 'border-[#6b4820] bg-[#120e08] text-[#d8ccb5] hover:bg-[#1d140c]'
                                }`}
                              >
                                Deactivate
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBoolean(name)}
                                className="inline-flex items-center gap-1 border border-[#5c1a1a] bg-[#1f0707] px-2 py-1 text-[#d45a5a] transition hover:bg-[#2b0b0b]"
                              >
                                <TrashIcon size={12} weight="bold" />
                                Remove
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>,
            document.body
          )
        : null}
    </>
  )
}
