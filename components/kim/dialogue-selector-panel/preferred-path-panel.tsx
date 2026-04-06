import { type PreferredPathOption } from './types'
import { isAvoidableBoolean, isFlirtingBoolean } from '@/lib/kim/boolean-utils'
import { TranscriptLine } from '@/lib/types'
import { ChatLine } from '../chat-line'
import { SystemChatLine } from '../system-chat-line'
import { useEffect, useState } from 'react'
import { Button } from '../../ui/button'
import { useTranslations } from 'next-intl'

type PreferredPathPanelProps = {
  selectedOptionId: number
  preferredPaths: PreferredPathOption[]
  selectedPreferredPathId: string | null
  onSelectPreferredPath: (id: string) => void
  onConfirmBooleanUpdate: () => void
  onShowConversation: () => void
  showConversation: boolean
}

function normalizeChatLine(
  line: PreferredPathOption['chatLines'][number]
): TranscriptLine {
  return {
    user: String(line.user).trim(),
    content: String(line.content ?? '').trim(),
    type: line.type,
  }
}

export function PreferredPathPanel({
  selectedOptionId,
  preferredPaths,
  selectedPreferredPathId,
  onSelectPreferredPath,
  onConfirmBooleanUpdate,
  onShowConversation,
  showConversation,
}: PreferredPathPanelProps) {
  const t = useTranslations('kim.chatroom')
  const [showBooleanUpdateNotice, setShowBooleanUpdateNotice] = useState(false)

  const selectedPreferredPath = preferredPaths.find(
    (option) => option.id === selectedPreferredPathId
  )

  useEffect(() => {
    if (!showBooleanUpdateNotice) return

    const timer = window.setTimeout(() => {
      setShowBooleanUpdateNotice(false)
    }, 2500)

    return () => window.clearTimeout(timer)
  }, [showBooleanUpdateNotice])

  return (
    <div className="space-y-3">
      <div className="border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          {t('choosePreferredPath')}
        </p>
        <ul className="mt-2 space-y-2">
          {preferredPaths.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-start gap-2 border border-[#3f2a11] bg-[#0f0a06] p-2">
                <input
                  type="radio"
                  name={`preferred-${selectedOptionId}`}
                  value={option.id}
                  checked={selectedPreferredPathId === option.id}
                  onChange={() => onSelectPreferredPath(option.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#f0bb5f]">{option.label}</p>
                  <p className="text-xs text-[#d8ccb5]">{option.metrics}</p>
                  {Object.keys(option.booleanMutations).length > 0 && (
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(option.booleanMutations).map(
                        ([name, value]) => {
                          const isAvoidable = isAvoidableBoolean(name)
                          const isFlirting = isFlirtingBoolean(name)

                          return (
                            <li
                              key={name}
                              className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs leading-tight ${
                                isAvoidable
                                  ? 'border-[#8a6418] bg-[#2b1d07] text-[#f1c768]'
                                  : isFlirting
                                    ? 'border-[#7b2f6e] bg-[#241021] text-[#f2b6ea]'
                                    : value
                                      ? 'border-[#3a5c1a] bg-[#0f1f07] text-[#8fd45a]'
                                      : 'border-[#5c1a1a] bg-[#1f0707] text-[#d45a5a]'
                              }`}
                              title={
                                isAvoidable
                                  ? 'This boolean is usually better to avoid if possible.'
                                  : isFlirting
                                    ? 'This is a flirting-related boolean.'
                                    : undefined
                              }
                            >
                              <span>{value ? '+' : '−'}</span>
                              <span>{name}</span>
                            </li>
                          )
                        }
                      )}
                    </ul>
                  )}
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={!selectedPreferredPathId}
        onClick={onShowConversation}
        className="w-full border border-[#8f5d1f] bg-[#2c1300] px-3 py-2 font-title text-lg text-[#f0bb5f] transition hover:bg-[#4a2000] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t('showConversation')}
      </button>

      {showConversation && selectedPreferredPath ? (
        <div className="border border-[#6b4820] bg-[#120e08] p-2">
          <p className="font-title text-lg text-[#f0bb5f]">
            {t('simulatedDialogue')}
          </p>
          {selectedPreferredPath.chatLines.length > 0 ? (
            <ul className="mt-2 space-y-1 border border-[#3f2a11] bg-[#0f0a06] p-2 text-sm text-[#ddd7c9]">
              {selectedPreferredPath.chatLines.map((line, index) => {
                const normalized = normalizeChatLine(line)

                return (
                  <li key={`${selectedPreferredPath.id}-${index}`}>
                    {normalized.user === 'system' ? (
                      <SystemChatLine line={normalized} />
                    ) : (
                      <ChatLine line={normalized} />
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#b9ac8f]">
              {t('noDialogueTextAvailable')}
            </p>
          )}

          <Button
            variant="default"
            size="lg"
            className="w-full mt-3"
            onClick={() => {
              onConfirmBooleanUpdate()
              setShowBooleanUpdateNotice(true)
            }}
          >
            {t('updateBooleanValues')}
          </Button>
          {showBooleanUpdateNotice ? (
            <p className="mt-2 border border-success-border bg-success-bg px-2 py-1 text-sm text-success">
              {t('booleanUpdated')}
            </p>
          ) : null}
          <p className="mt-1 text-center text-xs text-[#b9ac8f]">
            {t('futureSimulationsNotice')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
