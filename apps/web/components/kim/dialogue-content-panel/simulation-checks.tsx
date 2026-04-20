import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'

import { SimulationState } from '@tenno-companion/kim/types'

import { Switch } from '@/components/ui/switch'

type Props = {
  checks: {
    booleans: string[]
    counters: string[]
  }
  customState: SimulationState
  setCustomState: Dispatch<SetStateAction<SimulationState>>
}

export function SimulationChecks({
  checks,
  customState,
  setCustomState,
}: Props) {
  const t = useTranslations('kim.chatroom')

  return (
    <div className="flex gap-2 flex-col md:flex-row justify-between">
      <div className="w-full border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          {t('booleanChecks')}
        </p>
        {checks.booleans.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {checks.booleans.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between border border-[#3f2a11] bg-[#0f0a06] p-2"
              >
                <p className="text-sm text-[#d8ccb5]">{name}</p>
                <div className="flex items-center gap-3 text-sm">
                  <Switch
                    checked={customState.booleans[name] || false}
                    onCheckedChange={(checked) =>
                      setCustomState((previous) => ({
                        ...previous,
                        booleans: {
                          ...previous.booleans,
                          [name]: checked,
                        },
                      }))
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#b9ac8f]">
            {t('noBooleanChecksRequired')}
          </p>
        )}
      </div>

      <div className="w-full border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          {t('counterValues')}
        </p>
        {checks.counters.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {checks.counters.map((name) => (
              <li
                key={name}
                className="border border-[#3f2a11] bg-[#0f0a06] px-2 py-1"
              >
                <label className="flex items-center gap-1 text-sm text-[#d8ccb5]">
                  <span className="w-full">{name}</span>
                  <input
                    type="number"
                    defaultValue={customState.counters[name] ?? 0}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (!isNaN(value)) {
                        setCustomState((previous) => ({
                          ...previous,
                          counters: {
                            ...previous.counters,
                            [name]: value,
                          },
                        }))
                      }
                    }}
                    className="w-full border border-[#6b4820] bg-black px-2 py-1 text-[#efe4cb]"
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#b9ac8f]">
            {t('noCounterValuesRequired')}
          </p>
        )}
      </div>
    </div>
  )
}
