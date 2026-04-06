import { useMemo, useState, useSyncExternalStore } from 'react'
import { type DialogueOption } from './types'
import {
  COMPLETED_DIALOGUES_CHANGE_EVENT,
  COMPLETED_DIALOGUES_STORAGE_KEY,
} from '@/lib/constants'
import { CheckIcon } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

type DialogueOptionsListProps = {
  dialogueOptions: DialogueOption[]
  selectedStartId: number | null
  onSelect: (startId: number) => void
  isLoading?: boolean
}

const EMPTY_COMPLETED_DIALOGUES: Readonly<Record<string, boolean>> =
  Object.freeze({})
let cachedRawCompletedDialogues: string | null = null
let cachedParsedCompletedDialogues: Readonly<Record<string, boolean>> =
  EMPTY_COMPLETED_DIALOGUES

function subscribeCompletedDialogues(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleChange = () => onStoreChange()
  window.addEventListener('storage', handleChange)
  window.addEventListener(COMPLETED_DIALOGUES_CHANGE_EVENT, handleChange)

  return () => {
    window.removeEventListener('storage', handleChange)
    window.removeEventListener(COMPLETED_DIALOGUES_CHANGE_EVENT, handleChange)
  }
}

function getCompletedDialoguesSnapshot(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return EMPTY_COMPLETED_DIALOGUES
  }

  try {
    const raw = localStorage.getItem(COMPLETED_DIALOGUES_STORAGE_KEY)
    if (!raw) {
      cachedRawCompletedDialogues = null
      cachedParsedCompletedDialogues = EMPTY_COMPLETED_DIALOGUES
      return EMPTY_COMPLETED_DIALOGUES
    }

    if (raw === cachedRawCompletedDialogues) {
      return cachedParsedCompletedDialogues
    }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      cachedRawCompletedDialogues = raw
      cachedParsedCompletedDialogues = EMPTY_COMPLETED_DIALOGUES
      return EMPTY_COMPLETED_DIALOGUES
    }

    cachedRawCompletedDialogues = raw
    cachedParsedCompletedDialogues = parsed as Record<string, boolean>
    return cachedParsedCompletedDialogues
  } catch {
    cachedRawCompletedDialogues = null
    cachedParsedCompletedDialogues = EMPTY_COMPLETED_DIALOGUES
    return EMPTY_COMPLETED_DIALOGUES
  }
}

function getCompletedDialoguesServerSnapshot(): Record<string, boolean> {
  return EMPTY_COMPLETED_DIALOGUES
}

export function DialogueOptionsList({
  dialogueOptions,
  selectedStartId,
  onSelect,
  isLoading = false,
}: DialogueOptionsListProps) {
  const t = useTranslations('kim.chatroom')
  const [query, setQuery] = useState('')
  const completedDialogues = useSyncExternalStore(
    subscribeCompletedDialogues,
    getCompletedDialoguesSnapshot,
    getCompletedDialoguesServerSnapshot
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return dialogueOptions
    }

    return dialogueOptions.filter((item) => {
      const haystack = `${item.label} ${item.codename}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [dialogueOptions, query])

  return (
    <div className="h-full min-h-0 overflow-y-auto border border-[#8f5d1f] bg-black p-2">
      <div className="mb-2 relative">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchByDialogue')}
          className="w-full border border-[#6b4820] bg-[#120e08] px-2 py-1.5 text-sm text-[#ddd7c9] outline-none placeholder:text-[#8f7b5d] focus:border-[#cfad73]"
        />
        {isLoading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9f8a67] animate-pulse">
            ...
          </span>
        )}
      </div>

      {filteredOptions.length === 0 ? (
        <p className="px-1 text-sm text-[#9f8a67]">{t('noDialoguesMatch')}</p>
      ) : null}

      <ul className="space-y-1 pr-1">
        {filteredOptions.map((item) => {
          const active = item.id === selectedStartId
          const isCompleted = Boolean(completedDialogues[item.codename])

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-start gap-2 border px-2 py-1.5 text-left text-sm leading-snug transition ${
                  active
                    ? 'border-[#cfad73] bg-[#3e1f00] text-[#ffe2af]'
                    : 'border-[#6b4820] bg-[#120e08] text-[#d8ccb5] hover:bg-[#2a1805]'
                }`}
              >
                <span className="font-title text-base text-[#f0bb5f]">
                  {item.option}.
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block overflow-hidden">{item.label}</span>
                  <div className="flex justify-between gap-2">
                    <span
                      className={`mt-1 block text-xs ${
                        active ? 'text-[#d7b785]' : 'text-[#9f8a67]'
                      }`}
                    >
                      {item.codename}
                    </span>
                    {isCompleted ? (
                      <CheckIcon className="inline-block text-success size-4" />
                    ) : (
                      ''
                    )}
                  </div>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
