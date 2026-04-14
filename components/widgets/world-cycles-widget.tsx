'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn, counterToString } from '@/lib/utils'
import { Counter, WorldCycle } from '@/lib/types'
import { useGameData } from '../providers/game-data'

const CYCLE_ACCENT_CLASSES: Record<string, string> = {
  cetus: 'border-[#b58d57]/70 bg-[#24170c]/70',
  vallis: 'border-[#6b9da4]/70 bg-[#102028]/70',
  cambion: 'border-[#8d5d7a]/70 bg-[#26101d]/70',
  duviri: 'border-[#8d825d]/70 bg-[#1f1c10]/70',
  zariman: 'border-[#6b9da4]/70 bg-[#102028]/70',
}

type Props = {
  title: string
  stateLabel?: string
  expiry?: number
  now: number
  isUnavailable?: boolean
  accentClass: string
  isLoading: boolean
  mounted: boolean
}

function CycleCard({
  title,
  stateLabel,
  expiry,
  now,
  isUnavailable,
  accentClass,
  isLoading,
  mounted,
}: Props) {
  const t = useTranslations()

  const formatCountdown = (expiryTime: number): string => {
    if (!mounted) return '--h --m'
    const totalSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000))
    const countdown: Counter = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    }

    return counterToString(countdown, t, { alwaysShowMinutes: true })
  }

  return (
    <div className={cn('border p-2 transition-colors', accentClass)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-title text-lg leading-none text-foreground">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {mounted && stateLabel ? (
            <span className="border border-foreground/20 bg-background/40 px-1.5 py-0.5 text-xs uppercase tracking-[0.15em] text-primary">
              {stateLabel}
            </span>
          ) : (
            !isUnavailable &&
            isLoading && (
              <span className="h-5 w-12 animate-pulse border border-foreground/20 bg-background/40" />
            )
          )}

          {mounted && expiry ? (
            <p className="font-semibold leading-none text-foreground tabular-nums">
              {formatCountdown(expiry)}
            </p>
          ) : isUnavailable ? (
            <p className="border border-error-border/70 bg-error-bg/50 px-1.5 py-0.5 text-xs font-semibold uppercase leading-none text-error">
              {t('worldCycles.status.unavailable')}
            </p>
          ) : (
            <div className="h-5 w-20 animate-pulse rounded bg-foreground/10" />
          )}
        </div>
      </div>
    </div>
  )
}

export function WorldCyclesWidget() {
  const t = useTranslations('worldCycles')
  const {
    bountyCycle,
    dictionaries,
    exportData,
    fetchDictionary,
    fetchExportData,
    isLoading,
  } = useGameData()

  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    setNow(Date.now())

    void fetchDictionary('default')
    void fetchDictionary('oracle')
    void fetchExportData('factions')

    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [fetchDictionary, fetchExportData])

  const cycleStates = useMemo(() => {
    const results: Record<string, Partial<WorldCycle>> = {}
    if (!mounted) return results

    const dictDefault = dictionaries.default || {}
    const dictOracle = dictionaries.oracle || {}

    // API Driven Cycles
    if (bountyCycle) {
      const cetusNightStart = bountyCycle.expiry - 3_000_000
      const isCetusNight = now >= cetusNightStart
      results.cetus = {
        expiry: isCetusNight ? bountyCycle.expiry : cetusNightStart,
        state: isCetusNight ? 'night' : 'day',
      }
      results.cambion = {
        expiry: results.cetus.expiry,
        state: isCetusNight ? 'vome' : 'fass',
      }
      const zarimanFaction = exportData.factions?.[bountyCycle.zarimanFaction]
      results.zariman = {
        expiry: bountyCycle.expiry,
        state: zarimanFaction
          ? dictDefault[zarimanFaction.name!]
          : bountyCycle.zarimanFaction,
      }
    }

    // Math Driven Cycles (Orb Vallis)
    const VALLIS_EPOCH = new Date('November 10, 2018 08:13:48 UTC').getTime()
    const vProgress = (now - VALLIS_EPOCH) % 1_600_000
    const isVallisWarm = vProgress < 400_000
    results.vallis = {
      expiry: isVallisWarm
        ? now + (400_000 - vProgress)
        : now + (1_600_000 - vProgress),
      state: isVallisWarm ? 'warm' : 'cold',
    }

    // Math Driven Cycles (Duviri)
    const dIndex = Math.floor(now / 7_200_000)
    const dMoods = [
      '/Lotus/Language/Duviri/SadMoodTitleShort',
      '/Lotus/Language/Duviri/ScaredMoodTitleShort',
      '/Lotus/Language/Duviri/HappyMoodTitleShort',
      '/Lotus/Language/Duviri/AngryMoodTitleShort',
      '/Lotus/Language/Duviri/JealousMoodTitleShort',
    ]
    results.duviri = {
      expiry: (dIndex + 1) * 7_200_000,
      state: dictOracle[dMoods[dIndex % 5]],
    }

    return results
  }, [
    mounted,
    dictionaries.default,
    dictionaries.oracle,
    bountyCycle,
    now,
    exportData.factions,
  ])

  const dictDefault = dictionaries.default || {}

  return (
    <div className="flex flex-col gap-2">
      <CycleCard
        title={dictDefault['/Lotus/Language/Locations/EidolonPlains']}
        stateLabel={
          cycleStates.cetus?.state
            ? t(`states.${cycleStates.cetus.state}`)
            : undefined
        }
        expiry={cycleStates.cetus?.expiry}
        now={now}
        accentClass={CYCLE_ACCENT_CLASSES.cetus}
        isLoading={isLoading}
        mounted={mounted}
      />

      <CycleCard
        title={dictDefault['/Lotus/Language/Locations/VenusLandscape']}
        stateLabel={
          cycleStates.vallis?.state
            ? t(`states.${cycleStates.vallis.state}`)
            : undefined
        }
        expiry={cycleStates.vallis?.expiry}
        now={now}
        accentClass={CYCLE_ACCENT_CLASSES.vallis}
        isLoading={false}
        mounted={mounted}
      />

      <CycleCard
        title={
          dictDefault[
            '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosLandscapeName'
          ]
        }
        stateLabel={
          cycleStates.cambion?.state
            ? t(`states.${cycleStates.cambion.state}`)
            : undefined
        }
        expiry={cycleStates.cambion?.expiry}
        now={now}
        accentClass={CYCLE_ACCENT_CLASSES.cambion}
        isLoading={isLoading}
        mounted={mounted}
      />

      <CycleCard
        title={dictDefault['/Lotus/Language/Locations/Duviri']}
        stateLabel={cycleStates.duviri?.state}
        expiry={cycleStates.duviri?.expiry}
        now={now}
        accentClass={CYCLE_ACCENT_CLASSES.duviri}
        isLoading={false}
        mounted={mounted}
      />

      <CycleCard
        title={dictDefault['/Lotus/Language/Zariman/ZarimanRegionName']}
        stateLabel={cycleStates.zariman?.state}
        expiry={cycleStates.zariman?.expiry}
        now={now}
        accentClass={CYCLE_ACCENT_CLASSES.zariman}
        isLoading={isLoading}
        mounted={mounted}
      />
    </div>
  )
}
