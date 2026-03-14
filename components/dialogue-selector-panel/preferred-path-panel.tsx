import Image from 'next/image'
import { type PreferredPathOption } from './types'

type PreferredPathPanelProps = {
  selectedOptionId: number
  preferredPaths: PreferredPathOption[]
  selectedPreferredPathId: string | null
  onSelectPreferredPath: (id: string) => void
  onShowConversation: () => void
  showConversation: boolean
  chatroomIcon: string
}

function normalizeChatLine(line: PreferredPathOption['chatLines'][number]): {
  user: string
  content: string
} {
  if (typeof line === 'string') {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex > -1) {
      const user = line.slice(0, separatorIndex).trim().toLowerCase()
      const content = line.slice(separatorIndex + 1).trim()
      return { user, content }
    }

    return { user: 'system', content: line }
  }

  return {
    user: String(line.user).trim().toLowerCase(),
    content: String(line.content ?? '').trim(),
  }
}

export function PreferredPathPanel({
  selectedOptionId,
  preferredPaths,
  selectedPreferredPathId,
  onSelectPreferredPath,
  onShowConversation,
  showConversation,
  chatroomIcon,
}: PreferredPathPanelProps) {
  const selectedPreferredPath = preferredPaths.find(
    (option) => option.id === selectedPreferredPathId
  )

  return (
    <div className="space-y-3">
      <div className="border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          Choose preferred path
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
        Mostrar conversacion
      </button>

      {showConversation && selectedPreferredPath ? (
        <div className="border border-[#6b4820] bg-[#120e08] p-2">
          <p className="font-title text-lg text-[#f0bb5f]">
            Conversacion simulada
          </p>
          {selectedPreferredPath.chatLines.length > 0 ? (
            <ul className="mt-2 space-y-1 border border-[#3f2a11] bg-[#0f0a06] p-2 text-sm text-[#ddd7c9]">
              {selectedPreferredPath.chatLines.map((line, index) => {
                const normalized = normalizeChatLine(line)

                return (
                  <li key={`${selectedPreferredPath.id}-${index}`}>
                    {normalized.user === 'system' ? (
                      <>
                        <strong className="capitalize">
                          {normalized.user}:
                        </strong>{' '}
                        {normalized.content}
                      </>
                    ) : normalized.user === 'player' ? (
                      <div className="flex items-center gap-2">
                        <Image
                          src="https://wiki.warframe.com/images/LotusSymbolGlyph.png"
                          alt="Player"
                          width={55}
                          height={55}
                          className="border-2 border-primary/50"
                        />
                        <div className="flex flex-col">
                          <span className="text-primary text-xl capitalize">
                            {normalized.user}:
                          </span>
                          <span>{normalized.content}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Image
                          src={chatroomIcon}
                          alt="Chatroom"
                          width={55}
                          height={55}
                          className="border-2 border-primary/50 bg-[#2a3314]"
                        />
                        <div className="flex flex-col">
                          <span className="text-primary text-xl capitalize">
                            {normalized.user}:
                          </span>
                          <span>{normalized.content}</span>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#b9ac8f]">
              No dialogue text available on this path.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
