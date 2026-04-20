import { KIM_STORAGE_KEY } from '@/lib/constants'
import { Chat, Simulation } from '@tenno-companion/kim'
import type { Chatroom } from '@tenno-companion/kim/types'
import { useLocale } from 'next-intl'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react'

interface KimStorageV1 {
  booleans: Record<string, boolean>
  chemistry: Record<string, number>
  completedDialogues: Record<string, boolean | number[]>
  counters: Record<string, number>
  showSpoilers: boolean
}

const OLD_KEYS = {
  booleans: 'wf-kim:booleans',
  chemistry: 'wf-kim:chemistry',
  completed: 'wf-kim:completed-dialogues',
  counters: 'wf-kim:counters',
  spoilers: 'wf-kim:show-spoilers',
  lang: 'wf-kim:language', // Deprecated
}

function migrateKimStorage(): KimStorageV1 {
  // Check if migration already happened
  const existingV1 = localStorage.getItem(KIM_STORAGE_KEY)
  if (existingV1) {
    return JSON.parse(existingV1)
  }

  // Helper to safely parse old JSON keys
  const getOld = (key: string) => {
    const data = localStorage.getItem(key)
    try {
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  // Collect old data
  const migratedData: KimStorageV1 = {
    booleans: getOld(OLD_KEYS.booleans) || {},
    chemistry: getOld(OLD_KEYS.chemistry) || {},
    completedDialogues: getOld(OLD_KEYS.completed) || {},
    counters: getOld(OLD_KEYS.counters) || {},
    showSpoilers: Boolean(Number(localStorage.getItem(OLD_KEYS.spoilers))),
  }

  // Persist to new single-key format
  localStorage.setItem(KIM_STORAGE_KEY, JSON.stringify(migratedData))

  // Cleanup old keys
  Object.values(OLD_KEYS).forEach((key) => localStorage.removeItem(key))

  return migratedData
}

const storage = {
  get: (): KimStorageV1 => {
    // Run migration if necessary and return data
    if (typeof window === 'undefined') return {} as KimStorageV1
    return migrateKimStorage()
  },

  save: (data: Partial<KimStorageV1>) => {
    const current = storage.get()
    const updated = { ...current, ...data }
    localStorage.setItem(KIM_STORAGE_KEY, JSON.stringify(updated))
  },
}

export const loadBooleansFromStorage = () => storage.get().booleans
export const saveBooleansToStorage = (val: Record<string, boolean>) =>
  storage.save({ booleans: val })

export const loadCompletedDialoguesFromStorage = () =>
  storage.get().completedDialogues
export const saveCompletedDialoguesToStorage = (
  val: Record<string, boolean | number[]>
) => storage.save({ completedDialogues: val })

export const loadCountersFromStorage = () => storage.get().counters
export const saveCountersToStorage = (val: Record<string, number>) =>
  storage.save({ counters: val })

export const loadShowSpoilersFromStorage = () => storage.get().showSpoilers
export const saveShowSpoilersToStorage = (val: boolean) =>
  storage.save({ showSpoilers: val })

interface ChatContextValue {
  chat: Chat | null
  chatroom: Chatroom
  simulation: Simulation | null
  gameState: KimStorageV1
  updateBooleans: (booleans: Record<string, boolean>) => void
  updateChemistry: (chatroom: string, increment: number) => void
  updateCompletedDialogue: (key: string, value: number[]) => void
  updateCounters: (counters: Record<string, number>) => void
  updateShowSpoilers: (value: boolean) => void
  isPending: boolean
}

const KIMChatContext = createContext<ChatContextValue | undefined>(undefined)

interface Props {
  chatroom: Chatroom
  children: ReactNode
}

export function KIMChatProvider({ chatroom, children }: Props) {
  const locale = useLocale()
  const [chat, setChat] = useState<Chat | null>(null)
  const [isPending, startTransition] = useTransition()

  const [gameState, setGameState] = useState<KimStorageV1>(() => {
    const data = storage.get()
    return data
  })

  useEffect(() => {
    let isMounted = true

    startTransition(async () => {
      const instance = await Chat.create(chatroom, { locale })
      if (isMounted) {
        setChat(instance)
      }
    })

    return () => {
      isMounted = false
    }
  }, [chatroom, locale])

  useEffect(() => {
    storage.save(gameState)
  }, [gameState])

  const updateBooleans = (booleans: Record<string, boolean>) => {
    setGameState((prev) => ({
      ...prev,
      booleans: { ...prev.booleans, ...booleans },
    }))
  }

  const updateChemistry = (chatroom: string, increment: number) => {
    setGameState((prev) => ({
      ...prev,
      chemistry: {
        ...prev.chemistry,
        [chatroom]: (prev.chemistry[chatroom] ?? 0) + increment,
      },
    }))
  }

  const updateCompletedDialogue = (key: string, value: number[]) => {
    setGameState((prev) => ({
      ...prev,
      completedDialogues: { ...prev.completedDialogues, [key]: value },
    }))
  }

  const updateCounters = (counters: Record<string, number>) => {
    setGameState((prev) => ({
      ...prev,
      counters: { ...prev.counters, ...counters },
    }))
  }

  const updateShowSpoilers = (value: boolean) => {
    setGameState((prev) => ({
      ...prev,
      showSpoilers: value,
    }))
  }

  const simulation = useMemo(() => {
    if (!chat) return null
    return new Simulation(chat, { initialState: gameState })
  }, [chat, gameState])

  return (
    <KIMChatContext.Provider
      value={{
        chat,
        chatroom,
        gameState,
        isPending,
        simulation,
        updateBooleans,
        updateChemistry,
        updateCompletedDialogue,
        updateCounters,
        updateShowSpoilers,
      }}
    >
      {children}
    </KIMChatContext.Provider>
  )
}

export const useKIMChat = () => {
  const context = useContext(KIMChatContext)
  if (!context)
    throw new Error('useKIMChat must be used within a KIMChatProvider')
  return context
}
