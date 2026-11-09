import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { initialFamilies } from './data/families'
import { deleteFamily, loadFamilies, saveFamily } from './lib/db'
import type { Family } from './types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Store {
  families: Family[]
  /** True once the list came from the database; until then it is the copy built into the site. */
  familiesLoaded: boolean
  saveState: SaveState
  updateFamily: (id: string, patch: Partial<Family>) => void
  addFamily: (draft: Pick<Family, 'name' | 'fallen' | 'acceptsLetters'>) => void
  removeFamily: (id: string) => Promise<void>
}

const Ctx = createContext<Store | null>(null)

const SAVE_DELAY = 700

export function StoreProvider({ children }: { children: ReactNode }) {
  const [families, setFamilies] = useState<Family[]>(initialFamilies)
  const [familiesLoaded, setFamiliesLoaded] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const latest = useRef(families)
  latest.current = families
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    loadFamilies()
      .then((loaded) => {
        if (loaded.length) setFamilies(loaded)
        setFamiliesLoaded(true)
      })
      .catch(() => {
        // The built-in list keeps the site usable for reading and writing; sending reports its own error.
      })
  }, [])

  // Typing in the admin form saves once the person pauses, not on every key.
  const scheduleSave = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id))
    setSaveState('saving')
    timers.current.set(
      id,
      window.setTimeout(async () => {
        timers.current.delete(id)
        const family = latest.current.find((f) => f.id === id)
        if (!family) return
        try {
          await saveFamily(family)
          if (timers.current.size === 0) setSaveState('saved')
        } catch {
          setSaveState('error')
        }
      }, SAVE_DELAY),
    )
  }, [])

  const updateFamily = useCallback(
    (id: string, patch: Partial<Family>) => {
      setFamilies((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      scheduleSave(id)
    },
    [scheduleSave],
  )

  const addFamily = useCallback(
    (draft: Pick<Family, 'name' | 'fallen' | 'acceptsLetters'>) => {
      const id = `f${Date.now().toString(36)}`
      setFamilies((f) => [{ ...draft, id, sortOrder: Math.max(0, ...f.map((x) => x.sortOrder ?? 0)) + 1 }, ...f])
      scheduleSave(id)
    },
    [scheduleSave],
  )

  const removeFamily = useCallback(async (id: string) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setFamilies((f) => f.filter((x) => x.id !== id))
    setSaveState('saving')
    try {
      await deleteFamily(id)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [])

  const value = useMemo(
    () => ({ families, familiesLoaded, saveState, updateFamily, addFamily, removeFamily }),
    [families, familiesLoaded, saveState, updateFamily, addFamily, removeFamily],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

/** Families shown to visitors: a row the admin has just added stays hidden until it has a name. */
export function usePublicFamilies() {
  const { families } = useStore()
  return useMemo(() => families.filter((f) => f.name.trim() || f.fallen.some((p) => p.name.trim())), [families])
}
