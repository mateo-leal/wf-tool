import { useMemo, useState } from 'react'
import { type DialogueOption } from './types'
import { CheckIcon } from '@phosphor-icons/react'
import { useLocale, useTranslations } from 'next-intl'
import { FirstContentNode } from '@tenno-companion/kim/types'
import { getStandardLocale } from '@tenno-companion/core/locales'
import { useKIMChat } from '@/components/providers/kim-chat'

type Props = {
  firstNodes: FirstContentNode[]
  selectedStartId: number | null
  onSelect: (startId: number) => void
  isLoading: boolean
}

export function DialogueOptionsList({
  firstNodes,
  selectedStartId,
  onSelect,
  isLoading,
}: Props) {
  const t = useTranslations('kim.chatroom')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const {
    gameState: { completedDialogues },
  } = useKIMChat()

  const dialogueOptions: DialogueOption[] = useMemo(() => {
    return firstNodes.map((firstContentNode, index) => {
      const label = firstContentNode.dialogueNodes
        .map((node) => node.LocTag)
        .join('/')
      return {
        option: index + 1,
        id: firstContentNode.id,
        label,
        codename: firstContentNode.convoName,
      }
    })
  }, [firstNodes])

  /**
   * Creates a locale-aware search function.
   */
  const searchFilter = useMemo(() => {
    const standardLocale = getStandardLocale(locale)
    const collator = new Intl.Collator(standardLocale, {
      sensitivity: 'base',
      usage: 'search',
      ignorePunctuation: true,
    })

    const segmenter = new Intl.Segmenter(standardLocale, {
      granularity: 'grapheme',
    })

    const prepare = (str: string) => {
      return str
        .normalize('NFKC') // Universal compatibility normalization
        .replace(/\u3000/g, ' ') // Specifically target the Japanese "Double-byte" space
        .replace(/[\p{P}\p{S}]/gu, ' ') // Remove punctuation (globally)
        .replace(/\s+/g, ' ') // Collapse all whitespace into single spaces
        .trim()
    }

    const getSegments = (str: string) =>
      Array.from(segmenter.segment(str)).map((s) => s.segment)

    /**
     * Checks if a single term (word) exists inside a target text
     * using a locale-aware sliding window.
     */
    const includesInternal = (cleanTarget: string, cleanTerm: string) => {
      const targetSegments = getSegments(cleanTarget)
      const termSegments = getSegments(cleanTerm)

      if (termSegments.length > targetSegments.length) return false

      for (let i = 0; i <= targetSegments.length - termSegments.length; i++) {
        const window = targetSegments.slice(i, i + termSegments.length).join('')
        if (collator.compare(window, cleanTerm) === 0) return true
      }
      return false
    }

    return (data: DialogueOption[], rawQuery: string): DialogueOption[] => {
      const preparedQuery = prepare(rawQuery)
      if (!preparedQuery) return data

      // Split query into individual terms (e.g., "void だけど" -> ["void", "だけど"])
      const queryTerms = preparedQuery.split(' ')

      return data.filter((item) => {
        // Combine label and codename to search across both simultaneously
        const targetSearchString = prepare(`${item.label} ${item.codename}`)

        // EVERY term in the query must be found in the target (AND logic)
        return queryTerms.every((term) =>
          includesInternal(targetSearchString, term)
        )
      })
    }
  }, [locale])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      return dialogueOptions
    }

    return searchFilter(dialogueOptions, normalizedQuery)
  }, [searchFilter, dialogueOptions, query])

  if (isLoading) {
    return <DialogueListSkeleton />
  }

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
          const isCompleted = !!completedDialogues[item.codename]

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

const DialogueListSkeleton = () => {
  return (
    <div className="h-full min-h-0 overflow-y-auto border border-[#8f5d1f] bg-black p-2">
      {/* Search Input Skeleton */}
      <div className="mb-2 relative">
        <div className="h-9 w-full border border-[#6b4820] bg-[#120e08] animate-pulse" />
      </div>

      {/* List Skeleton */}
      <ul className="space-y-1 pr-1">
        {[...Array(9)].map((_, i) => (
          <li key={i}>
            <div className="flex w-full items-start gap-2 border border-[#6b4820] bg-[#120e08] px-2 py-1.5 animate-pulse">
              {/* Option Number Skeleton (e.g., 1.) */}
              <div className="h-5 w-4 bg-[#6b4820] rounded" />

              <div className="min-w-0 flex-1 space-y-2">
                {/* Main Label Skeleton */}
                <div className="h-4 w-3/4 bg-[#3e2b14] rounded" />

                <div className="flex justify-between items-center">
                  {/* Codename Skeleton */}
                  <div className="h-3 w-1/3 bg-[#2a1d0d] rounded" />
                  {/* Icon Placeholder */}
                  <div className="h-3 w-3 bg-[#2a1d0d] rounded-full" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
