import { useMemo, useState } from 'react'
import { CheckIcon } from '@phosphor-icons/react'
import { useLocale, useTranslations } from 'next-intl'
import { FirstContentNode } from '@tenno-companion/kim/types'
import { getStandardLocale } from '@tenno-companion/core/locales'

import { cn } from '@/lib/utils'
import { Panel } from '@/components/ui/panel'
import { TextInput } from '@/components/ui/text-input'
import { useKIMChat } from '@/components/providers/kim-chat'

type DialogueOption = {
  option: number
  id: number
  label: string
  codename: string
}

type Props = {
  firstNodes: FirstContentNode[]
  selectedStartId: number | null
  onSelect: (startId: number) => void
}

export function DialogueOptionsList({
  firstNodes,
  selectedStartId,
  onSelect,
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

    const segmenter =
      typeof Intl !== 'undefined' && 'Segmenter' in Intl
        ? new Intl.Segmenter(standardLocale, { granularity: 'grapheme' })
        : null

    const prepare = (str: string) => {
      return str
        .normalize('NFKC') // Universal compatibility normalization
        .replace(/\u3000/g, ' ') // Specifically target the Japanese "Double-byte" space
        .replace(/[\p{P}\p{S}]/gu, ' ') // Remove punctuation (globally)
        .replace(/\s+/g, ' ') // Collapse all whitespace into single spaces
        .trim()
    }

    const getSegments = (str: string) => {
      if (segmenter) {
        return Array.from(segmenter.segment(str)).map((s) => s.segment)
      }
      /**
       * Fallback for grapheme segmentation when Intl.Segmenter is missing.
       * Array.from(str) correctly handles most emoji/surrogate pairs,
       * though it's less precise for complex script clusters than Segmenter.
       * Note: This only happened once from a user with Firefox 134.
       * Probably related to privacy or fingerprinting settings
       */
      return Array.from(str)
    }

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

  return (
    <Panel className="h-full min-h-0 overflow-y-auto space-y-2">
      <TextInput
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('searchByDialogue')}
      />

      {filteredOptions.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          {t('noDialoguesMatch')}
        </p>
      ) : (
        <ul className="space-y-1">
          {filteredOptions.map((item) => {
            const active = item.id === selectedStartId
            const isCompleted = !!completedDialogues[item.codename]

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    'flex w-full items-start gap-2 border px-2 py-1.5 text-left text-sm leading-snug transition',
                    {
                      'border-primary bg-muted-primary/10 text-primary': active,
                      'border-muted-primary/70 hover:bg-muted-primary/10 bg-pressable-bg':
                        !active,
                    }
                  )}
                >
                  <span className="font-title text-base text-primary">
                    {item.option}.
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block overflow-hidden">{item.label}</span>
                    <div className="flex justify-between gap-2">
                      <span
                        className={cn('mt-1 block text-xs', {
                          'text-foreground': active,
                          'text-muted-foreground': !active,
                        })}
                      >
                        {item.codename}
                      </span>
                      {isCompleted && (
                        <CheckIcon className="inline-block text-success size-4" />
                      )}
                    </div>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
