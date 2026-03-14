import { type DialogueOption } from './types'

type DialogueOptionsListProps = {
  dialogueOptions: DialogueOption[]
  selectedStartId: number | null
  onSelect: (startId: number) => void
}

export function DialogueOptionsList({
  dialogueOptions,
  selectedStartId,
  onSelect,
}: DialogueOptionsListProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto border border-[#8f5d1f] bg-black p-2">
      <ul className="space-y-1 pr-1">
        {dialogueOptions.map((item) => {
          const active = item.id === selectedStartId

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
                <span className="min-w-0 flex-1">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
