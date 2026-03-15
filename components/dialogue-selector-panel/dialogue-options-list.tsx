import { useMemo, useState } from 'react'
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
  const [query, setQuery] = useState('')

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
      <div className="mb-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por dialogo o codename"
          className="w-full border border-[#6b4820] bg-[#120e08] px-2 py-1.5 text-sm text-[#ddd7c9] outline-none placeholder:text-[#8f7b5d] focus:border-[#cfad73]"
        />
      </div>

      {filteredOptions.length === 0 ? (
        <p className="px-1 text-sm text-[#9f8a67]">
          No hay dialogos que coincidan con la busqueda.
        </p>
      ) : null}

      <ul className="space-y-1 pr-1">
        {filteredOptions.map((item) => {
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
                <span className="min-w-0 flex-1">
                  <span className="block">{item.label}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      active ? 'text-[#d7b785]' : 'text-[#9f8a67]'
                    }`}
                  >
                    {item.codename}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
