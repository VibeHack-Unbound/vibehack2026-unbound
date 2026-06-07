import { useSyncExternalStore } from 'react'
import { MEI_DATA, type DayEntry } from './meiData'

const STORAGE_KEY = 'unbound.voiceJournal.v1'
const listeners = new Set<() => void>()

export type StoredJournalEntry = DayEntry & {
  source?: 'manual' | 'voice'
  updatedAt?: number
  voiceTranscript?: string
}

let cachedRaw: string | null = null
let cachedSnapshot: StoredJournalEntry[] | null = null

const isBrowser = () => typeof window !== 'undefined'

const notify = () => {
  cachedSnapshot = null
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  if (isBrowser()) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        cachedSnapshot = null
        listener()
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  return () => listeners.delete(listener)
}

export function readStoredJournalEntries(): StoredJournalEntry[] {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredJournalEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredJournalEntries(entries: StoredJournalEntry[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  notify()
}

export function getJournalEntriesSnapshot(): StoredJournalEntry[] {
  const raw = isBrowser() ? window.localStorage.getItem(STORAGE_KEY) : null
  if (cachedSnapshot && raw === cachedRaw) {
    return cachedSnapshot
  }

  const byDate = new Map<string, StoredJournalEntry>()

  MEI_DATA.forEach((entry) => {
    byDate.set(entry.date, entry)
  })

  readStoredJournalEntries().forEach((entry) => {
    byDate.set(entry.date, entry)
  })

  cachedRaw = raw
  cachedSnapshot = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  return cachedSnapshot
}

export function useJournalEntries() {
  return useSyncExternalStore(
    subscribe,
    getJournalEntriesSnapshot,
    () => MEI_DATA,
  )
}

export function saveJournalEntry(entry: StoredJournalEntry) {
  const stored = readStoredJournalEntries()
  const withoutDate = stored.filter((current) => current.date !== entry.date)
  writeStoredJournalEntries([
    ...withoutDate,
    {
      ...entry,
      source: entry.source ?? 'voice',
      updatedAt: Date.now(),
    },
  ])
}

export function getEntryByDateFromEntries(
  entries: DayEntry[],
  date: string,
): DayEntry | undefined {
  return entries.find((entry) => entry.date === date)
}

export function getLatestEntryFromEntries(entries: DayEntry[]): DayEntry {
  return entries[entries.length - 1] ?? MEI_DATA[MEI_DATA.length - 1]
}
