import { useTranslations } from 'next-intl'
import { ArrowRightIcon } from '@phosphor-icons/react'

import {
  NodeType,
  AVOIDABLE_BOOLEAN_NAMES,
  ROMANCE_BOOLEAN_NAMES,
  NO_ROMANCE_BOOLEAN_NAMES,
} from '@tenno-companion/kim/constants'
import { DialoguePath, OptimizedResults } from '@tenno-companion/kim/types'

import { cn } from '@/lib/utils'
import { useKIMChat } from '@/components/providers/kim-chat'

type Props = {
  optimizedResults: OptimizedResults
  setActiveDialoguePath: (path: DialoguePath) => void
}

export function PreferredPathPanel({
  optimizedResults,
  setActiveDialoguePath,
}: Props) {
  const t = useTranslations('kim.chatroom')
  const {
    gameState: { counters },
  } = useKIMChat()

  const sections = [
    { data: optimizedResults.bestGeneral, label: t('bestOverallPath') },
    { data: optimizedResults.bestChemistry, label: t('bestChemistryPath') },
    { data: optimizedResults.bestCounterGains, label: t('bestCounterPath') },
    {
      data: optimizedResults.bestPositiveRomance,
      label: t('bestRomancePath'),
    },
    {
      data: optimizedResults.bestNegativeRomance,
      label: t('bestBadRomancePath'),
    },
  ]

  const amountOfValidPaths = sections.reduce((acc, section) => {
    if (!section.data || !Array.isArray(section.data)) return acc

    const hasValidPath = section.data.some((path) =>
      path.nodes?.some(
        (node) =>
          node.type === NodeType.Dialogue || node.type === NodeType.PlayerChoice
      )
    )

    return acc + (hasValidPath ? 1 : 0)
  }, 0)

  if (amountOfValidPaths === 0) {
    return (
      <div className="space-y-3">
        <div className="border border-[#6b4820] bg-[#120e08] p-2">
          <p className="text-foreground">
            There&apos;s no paths for your boolean and counter values.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="border border-[#6b4820] bg-[#120e08] p-2">
        <p className="font-title text-lg text-[#f0bb5f]">
          {t('choosePreferredPath')}
        </p>
        <ul className="mt-2 space-y-2">
          {sections.map((section) =>
            section.data.map((path, index) => (
              <PathItem
                key={`${section.label}-${index}`}
                path={path}
                label={section.label}
                counters={counters}
                setActiveDialoguePath={setActiveDialoguePath}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

const PathItem = ({
  path,
  label,
  counters,
  setActiveDialoguePath,
}: {
  path: DialoguePath
  label: string
  counters: Record<string, number>
  setActiveDialoguePath: (dialogue: DialoguePath) => void
}) => (
  <li>
    <button
      className={cn(
        'w-full flex flex-col cursor-pointer items-start p-2',
        'border border-[#3f2a11] bg-[#0f0a06] hover:bg-[#161009] transition-colors'
      )}
      onClick={() => setActiveDialoguePath(path)}
    >
      <div>
        <p className="text-sm font-medium text-[#f0bb5f]">{label}</p>
        {path.isUncertain && (
          <p className="text-xs text-[#d8ccb5]">Uncertain</p>
        )}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1">
        {path.mutations.chemistry > 0 && (
          <MutationBadge
            key="chemistry"
            name={'Chemistry'}
            value={path.mutations.chemistry}
            type="chemistry"
          />
        )}
        {path.mutations.set.map((name: string) => (
          <MutationBadge key={`set-${name}`} name={name} type="set" />
        ))}
        {path.mutations.reset.map((name: string) => (
          <MutationBadge key={`reset-${name}`} name={name} type="reset" />
        ))}
        {Object.entries(path.mutations.increments).map(([name, value]) => (
          <MutationBadge
            key={`inc-${name}`}
            name={name}
            type="increment"
            value={value}
            oldValue={counters[name]}
          />
        ))}
      </ul>
    </button>
  </li>
)

const MutationBadge = ({
  name,
  type,
  value,
  oldValue,
}: {
  name: string
  type: 'set' | 'reset' | 'increment' | 'chemistry'
  value?: number
  oldValue?: number
}) => {
  const isAvoidable = AVOIDABLE_BOOLEAN_NAMES.includes(name)
  const isRomance = ROMANCE_BOOLEAN_NAMES.includes(name)
  const isBadRomance = NO_ROMANCE_BOOLEAN_NAMES.includes(name)

  const getStyles = () => {
    if (isBadRomance) return 'border-[#5c1a4b] bg-[#1a0715] text-[#d45ab4]'
    if (isRomance) return 'border-[#7b2f6e] bg-[#241021] text-[#f2b6ea]'
    if (isAvoidable) return 'border-[#8a6418] bg-[#2b1d07] text-[#f1c768]'

    if (type === 'chemistry')
      return 'border-[#7b2f6e] bg-[#241021] text-[#f2b6ea]'
    if (type === 'reset') return 'border-[#5c1a1a] bg-[#1f0707] text-[#d45a5a]'
    return 'border-[#3a5c1a] bg-[#0f1f07] text-[#8fd45a]'
  }

  return (
    <li
      className={cn(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs leading-tight',
        getStyles()
      )}
      title={
        isAvoidable
          ? 'Avoidable'
          : isRomance
            ? 'Romance'
            : isBadRomance
              ? 'Negative Romance'
              : undefined
      }
    >
      {/* Symbol for booleans */}
      {type === 'set' && <span>+</span>}
      {type === 'reset' && <span>-</span>}

      <span>{name}</span>

      {/* Chemistry */}
      {type === 'chemistry' && <span>+{value}</span>}

      {/* Counter specific display */}
      {type === 'increment' && (
        <span className="flex gap-1 ml-1">
          <span>:</span>
          <span className="line-through opacity-60">{oldValue ?? 0}</span>
          <ArrowRightIcon />
          <span>{value}</span>
        </span>
      )}
    </li>
  )
}
