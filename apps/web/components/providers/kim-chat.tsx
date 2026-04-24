'use client'

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'

import { Chat, Simulation } from '@tenno-companion/kim'
import type { Chatroom, Node } from '@tenno-companion/kim/types'

import { KIM_STORAGE_EVENT, KIM_STORAGE_KEY } from '@/lib/storage-keys'

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

const EMPTY_STORAGE: KimStorageV1 = {
  booleans: {},
  chemistry: {},
  completedDialogues: {},
  counters: {},
  showSpoilers: false,
}

let snapshot = EMPTY_STORAGE

const kimStore = {
  // Subscribe to changes (both internal and from other tabs)
  subscribe: (callback: () => void) => {
    const handleUpdate = () => {
      snapshot = storage.get() // Update the reference only when event happens
      callback()
    }
    window.addEventListener(KIM_STORAGE_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)

    // Initialize snapshot on first subscribe (client side)
    snapshot = storage.get()

    return () => {
      window.removeEventListener(KIM_STORAGE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  },

  // The "Client" snapshot
  getSnapshot: () => snapshot,

  // The "Server" snapshot
  getServerSnapshot: () => EMPTY_STORAGE,

  // Updated save method to trigger the event
  save: (data: Partial<KimStorageV1>) => {
    storage.save(data)
    // Notify all subscribers in this tab
    window.dispatchEvent(new Event(KIM_STORAGE_EVENT))
  },

  updateBooleans: (booleans: Record<string, boolean>) => {
    const current = kimStore.getSnapshot()
    kimStore.save({
      booleans: { ...current.booleans, ...booleans },
    })
  },

  updateChemistry: (chatroom: string, increment: number) => {
    const current = kimStore.getSnapshot()
    kimStore.save({
      chemistry: {
        ...current.chemistry,
        [chatroom]: (current.chemistry[chatroom] ?? 0) + increment,
      },
    })
  },

  updateCompletedDialogue: (key: string, value: number[]) => {
    const current = kimStore.getSnapshot()
    kimStore.save({
      completedDialogues: { ...current.completedDialogues, [key]: value },
    })
  },

  updateCounters: (counters: Record<string, number>) => {
    const current = kimStore.getSnapshot()
    kimStore.save({
      counters: { ...current.counters, ...counters },
    })
  },

  updateShowSpoilers: (value: boolean) => {
    kimStore.save({ showSpoilers: value })
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
  chat: Chat
  chatroom: Chatroom
  simulation: Simulation
  gameState: KimStorageV1
  updateBooleans: (booleans: Record<string, boolean>) => void
  updateChemistry: (chatroom: string, increment: number) => void
  updateCompletedDialogue: (key: string, value: number[]) => void
  updateCounters: (counters: Record<string, number>) => void
  updateShowSpoilers: (value: boolean) => void
}

const KIMChatContext = createContext<ChatContextValue | undefined>(undefined)

interface Props {
  children: ReactNode
  initialData: {
    chatroom: Chatroom
    nodes: Node[]
  }
}

export function KIMChatProvider({ children, initialData }: Props) {
  const gameState = useSyncExternalStore(
    kimStore.subscribe,
    kimStore.getSnapshot,
    kimStore.getServerSnapshot
  )

  useEffect(() => {
    storage.save(gameState)
  }, [gameState])

  const actions = useMemo(
    () => ({
      updateBooleans: kimStore.updateBooleans,
      updateChemistry: kimStore.updateChemistry,
      updateCompletedDialogue: kimStore.updateCompletedDialogue,
      updateCounters: kimStore.updateCounters,
      updateShowSpoilers: kimStore.updateShowSpoilers,
    }),
    []
  )

  const chat = useMemo(
    () => new Chat(initialData.chatroom, initialData.nodes),
    [initialData]
  )

  const simulation = useMemo(
    () => new Simulation(chat, { initialState: gameState }),
    [chat, gameState]
  )

  return (
    <KIMChatContext.Provider
      value={{
        chat,
        chatroom: chat.chatroom,
        gameState,
        simulation,
        ...actions,
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
