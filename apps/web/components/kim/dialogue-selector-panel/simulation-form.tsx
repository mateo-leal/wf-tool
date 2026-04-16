import { useTranslations } from 'next-intl'
import { type SimulationRequirements } from './types'

type SimulationFormProps = {
  selectedOptionId: number
  requirements: SimulationRequirements
  booleanValues: Record<string, boolean>
  counterValues: Record<string, number>
  onBooleanChange: (name: string, value: boolean) => void
  onCounterChange: (name: string, value: number) => void
  onSubmit: () => void
}

export function SimulationForm({
  selectedOptionId,
  requirements,
  booleanValues,
  counterValues,
  onBooleanChange,
  onCounterChange,
  onSubmit,
}: SimulationFormProps) {
  const t = useTranslations('kim.chatroom')

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          {t('booleanChecks')}
        </p>
        {requirements.booleans.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {requirements.booleans.map((name) => (
              <li
                key={name}
                className="border border-[#3f2a11] bg-[#0f0a06] p-2"
              >
                <p className="text-sm text-[#d8ccb5]">{name}</p>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name={`bool-${selectedOptionId}-${name}`}
                      value="true"
                      checked={booleanValues[name] !== false}
                      onChange={() => onBooleanChange(name, true)}
                    />
                    {t('true')}
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name={`bool-${selectedOptionId}-${name}`}
                      value="false"
                      checked={booleanValues[name] === false}
                      onChange={() => onBooleanChange(name, false)}
                    />
                    {t('false')}
                  </label>
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

      <div className="border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          {t('counterValues')}
        </p>
        {requirements.counters.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {requirements.counters.map((counter) => (
              <li
                key={counter.name}
                className="border border-[#3f2a11] bg-[#0f0a06] p-2"
              >
                <label className="flex flex-col gap-1 text-sm text-[#d8ccb5]">
                  <span>{counter.name}</span>
                  <input
                    type="number"
                    name={`counter-${selectedOptionId}-${counter.name}`}
                    value={counterValues[counter.name] ?? 0}
                    onChange={(event) =>
                      onCounterChange(counter.name, Number(event.target.value))
                    }
                    className="w-full border border-[#6b4820] bg-black px-2 py-1 text-[#efe4cb]"
                  />
                </label>
                {counter.expressions.length > 0 ? (
                  <p className="mt-1 text-xs text-[#b9ac8f]">
                    {t('conditions', {
                      conditions: counter.expressions.join(' | '),
                    })}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#b9ac8f]">
            {t('noCounterValuesRequired')}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full border border-[#8f5d1f] bg-[#2c1300] px-3 py-2 font-title text-lg text-[#f0bb5f] transition hover:bg-[#4a2000]"
      >
        {t('simulate')}
      </button>
    </form>
  )
}
