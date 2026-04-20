'use client'

import { useEffect, useState, useTransition } from 'react'
import type {
  DialoguePath,
  FirstContentNode,
  OptimizedResults,
  SimulationState,
} from '@tenno-companion/kim/types'

import { useKIMChat } from '../../providers/kim-chat'
import { SimulationChecks } from './simulation-checks'
import { PreferredPathPanel } from './preferred-path-panel'
import { DialogueViewerPanel } from './dialogue-viewer-panel'
import { Button } from '@/components/ui/button'
import { CaretLeftIcon } from '@phosphor-icons/react'
import { useLocale } from 'next-intl'
import { SimulationLoadingState } from './loading-state'

type Props = {
  option: FirstContentNode
}

export function DialogueContentPanel({ option }: Props) {
  const locale = useLocale()
  const { chatroom, gameState } = useKIMChat()

  const [isPending, startTransition] = useTransition()
  const [activeDialoguePath, setActiveDialoguePath] = useState<DialoguePath>()

  const [customState, setCustomState] = useState<SimulationState>({
    booleans: gameState.booleans,
    counters: gameState.counters,
  })

  const [checks, setChecks] = useState<{
    booleans: string[]
    counters: string[]
  } | null>(null)

  const [optimizedResults, setOptimizedResults] =
    useState<OptimizedResults | null>(null)

  const label = option.dialogueNodes.map((node) => node.LocTag).join('/')

  useEffect(() => {
    const controller = new AbortController()

    startTransition(async () => {
      try {
        // Reset results when starting a new fetch
        setChecks(null)
        setOptimizedResults(null)

        const searchParams = new URLSearchParams({
          locale,
          startNodeId: String(option.id),
          state: JSON.stringify(customState),
        })

        const response = await fetch(
          `/api/simulate/${chatroom}?${searchParams.toString()}`,
          { signal: controller.signal }
        )

        if (!response.ok) throw new Error('Failed to fetch simulation')

        const data = await response.json()

        setChecks(data.checks)
        setOptimizedResults(data.optimizedResults)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Simulation fetch error:', err)
        }
      }
    })

    return () => controller.abort()
  }, [chatroom, customState, locale, option.id])

  useEffect(() => {
    setActiveDialoguePath(undefined)
  }, [option])

  return (
    <section className="min-h-0 border border-muted-primary p-3 h-full overflow-y-auto">
      <div className="space-y-3 text-foreground">
        <div className="flex items-center gap-2">
          {activeDialoguePath && (
            <Button
              variant="outline"
              onClick={() => setActiveDialoguePath(undefined)}
              className="size-7 p-0"
            >
              <CaretLeftIcon className="size-5" />
            </Button>
          )}
          <p className="font-title text-xl text-primary">{label}</p>
        </div>
        <div className={activeDialoguePath !== undefined ? 'hidden' : ''}>
          {isPending && <SimulationLoadingState />}
          {!isPending && checks && optimizedResults ? (
            <div className="animate-in fade-in duration-300 flex flex-col gap-2">
              <SimulationChecks
                checks={checks}
                customState={customState}
                setCustomState={setCustomState}
              />
              <PreferredPathPanel
                optimizedResults={optimizedResults}
                setActiveDialoguePath={setActiveDialoguePath}
              />
            </div>
          ) : (
            !isPending && (
              <div className="text-center py-10 text-destructive">
                Failed to load simulation results.
              </div>
            )
          )}
        </div>
        {activeDialoguePath !== undefined && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DialogueViewerPanel dialoguePath={activeDialoguePath} />
          </div>
        )}
      </div>
    </section>
  )
}
