'use client'

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'

import { BountyCycles } from '@/lib/types'
import { OracleWorldState } from '@/lib/world-state/types'
import { Dictionary, DictionarySource, getDictionary } from '@/lib/language'
import { fetchOracleWorldState } from '@/lib/world-state/fetch-world-state'
import {
  MissionType,
  Intrinsic,
  PublicExportMap,
  PublicExportType,
  Region,
} from '@/lib/public-export/types'
import { useLocale } from 'next-intl'
import {
  fetchPublicExportIntrinsics,
  fetchPublicExportMissionTypes,
  fetchPublicExportRegions,
} from '@/lib/public-export/fetch-public-export'

type GameDataContextValue = {
  worldState?: OracleWorldState
  dictionaries: Partial<Record<DictionarySource, Dictionary>>
  bountyCycle?: BountyCycles
  exportData: Partial<{
    missionTypes: PublicExportMap<MissionType>
    regions: PublicExportMap<Region>
    railjackIntrinsics: PublicExportMap<Intrinsic>
  }>
  isLoading: boolean
  fetchDictionary: (source: DictionarySource) => Promise<void>
  fetchExportData: (type: PublicExportType) => Promise<void>
}

const GameDataContext = createContext<GameDataContextValue | undefined>(
  undefined
)

export function GameDataProvider({ children }: { children: ReactNode }) {
  const locale = useLocale()

  const fetchingRefs = useRef<Set<string>>(new Set())

  const [worldState, setWorldState] = useState<OracleWorldState>()
  const [bountyCycle, setBountyCycle] = useState<BountyCycles>()
  const [dictionaries, setDictionaries] = useState<
    Partial<Record<DictionarySource, Dictionary>>
  >({})
  const [exportData, setExportData] = useState<
    GameDataContextValue['exportData']
  >({})
  const [isLoading, setIsLoading] = useState(true)

  // World State (Refetch every 5 minutes)
  const loadWorldState = useCallback(async () => {
    // Only fetch if not already in flight
    if (fetchingRefs.current.has('world-state')) return
    fetchingRefs.current.add('world-state')

    try {
      const fetched = await fetchOracleWorldState()
      setWorldState(fetched)
    } finally {
      fetchingRefs.current.delete('world-state')
    }
  }, [])

  // Bounty Cycles (Refetch based on expiry)
  const loadBountyCycles = useCallback(async () => {
    if (fetchingRefs.current.has('bounty-cycle')) return
    fetchingRefs.current.add('bounty-cycle')

    try {
      const res = await fetch('https://oracle.browse.wf/bounty-cycle', {
        cache: 'no-store',
      })
      if (res.ok) {
        const fetched: BountyCycles = await res.json()
        setBountyCycle(fetched)
      }
    } finally {
      fetchingRefs.current.delete('bounty-cycle')
    }
  }, [])

  const fetchDictionary = useCallback(
    async (source: DictionarySource) => {
      if (dictionaries[source] || fetchingRefs.current.has(`dict-${source}`))
        return
      fetchingRefs.current.add(`dict-${source}`)
      try {
        const dict = await getDictionary(locale, { source })
        setDictionaries((prev) => ({ ...prev, [source]: dict }))
      } finally {
        fetchingRefs.current.delete(`dict-${source}`)
      }
    },
    [locale, dictionaries]
  )

  const fetchExportData = useCallback(
    async (type: PublicExportType) => {
      if (exportData[type] || fetchingRefs.current.has(`export-${type}`)) return

      fetchingRefs.current.add(`export-${type}`)
      try {
        if (type === 'missionTypes') {
          const data = await fetchPublicExportMissionTypes()
          setExportData((prev) => ({ ...prev, missionTypes: data }))
        } else if (type === 'regions') {
          const data = await fetchPublicExportRegions()
          setExportData((prev) => ({ ...prev, regions: data }))
        } else if (type === 'railjackIntrinsics') {
          const data = await fetchPublicExportIntrinsics()
          setExportData((prev) => ({ ...prev, railjackIntrinsics: data }))
        }
      } catch (error) {
        console.error(`Error fetching export data ${type}:`, error)
      } finally {
        fetchingRefs.current.delete(`export-${type}`)
      }
    },
    [exportData]
  )

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      await Promise.allSettled([loadWorldState(), loadBountyCycles()])
      if (isMounted) setIsLoading(false)
    }

    init()

    const wsInterval = setInterval(loadWorldState, 5 * 60 * 1000)
    const bountyCheckInterval = setInterval(() => {
      if (
        bountyCycle?.expiry &&
        Date.now() >= new Date(bountyCycle.expiry).getTime()
      ) {
        loadBountyCycles()
      }
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(wsInterval)
      clearInterval(bountyCheckInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadWorldState, loadBountyCycles])

  return (
    <GameDataContext.Provider
      value={{
        worldState,
        dictionaries,
        bountyCycle,
        exportData,
        isLoading,
        fetchDictionary,
        fetchExportData,
      }}
    >
      {children}
    </GameDataContext.Provider>
  )
}

export function useGameData() {
  const context = useContext(GameDataContext)
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider')
  }
  return context
}
