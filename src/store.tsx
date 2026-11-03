import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { initialFamilies } from './data/families'
import type { Family, Letter } from './types'

const sampleDesign = (themeId: string, bgId: string, fontId: string): Letter['design'] => ({
  themeId,
  bgId,
  fontId,
  size: 1,
  baseRatio: 0.031,
  items: [],
  strokes: [],
})

// Stands in for stored letters until a database exists. Everything here lives in memory and is lost on refresh.
const sampleLetters: Letter[] = [
  {
    id: 'sample-1',
    familyId: 'sample',
    greeting: 'למשפחה היקרה,',
    text: 'זהו מכתב לדוגמה בלבד, להמחשת מסך הניהול.\nמכתבים אמיתיים יופיעו כאן אחרי שיישלחו מדף הכתיבה.',
    design: sampleDesign('hope', 'frame', 'frank'),
    writer: 'כותב/ת לדוגמה',
    email: 'sample@example.com',
    isPublic: false,
    signature: 'באהבה, כותב/ת לדוגמה',
    status: 'new',
    createdAt: new Date(2026, 9, 12).getTime(),
    sample: true,
  },
  {
    id: 'sample-2',
    familyId: 'sample',
    greeting: 'למשפחה היקרה,',
    text: 'גם זה מכתב לדוגמה, בעיצוב אחר.',
    design: sampleDesign('gold', 'waves', 'heebo'),
    writer: 'כיתה לדוגמה',
    email: '',
    isPublic: true,
    signature: 'בהערכה, כיתה לדוגמה',
    status: 'printed',
    createdAt: new Date(2026, 9, 20).getTime(),
    sample: true,
  },
]

interface Store {
  families: Family[]
  letters: Letter[]
  addLetter: (letter: Letter) => void
  updateLetter: (id: string, patch: Partial<Letter>) => void
  updateFamily: (id: string, patch: Partial<Family>) => void
  addFamily: () => void
  removeFamily: (id: string) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [families, setFamilies] = useState<Family[]>(initialFamilies)
  const [letters, setLetters] = useState<Letter[]>(sampleLetters)

  const addLetter = useCallback((letter: Letter) => setLetters((l) => [letter, ...l]), [])
  const updateLetter = useCallback(
    (id: string, patch: Partial<Letter>) => setLetters((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [],
  )
  const updateFamily = useCallback(
    (id: string, patch: Partial<Family>) => setFamilies((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [],
  )
  const addFamily = useCallback(
    () =>
      setFamilies((f) => [
        { id: `new-${Date.now()}`, name: '', fallen: '', city: '', date: '', acceptsLetters: true },
        ...f,
      ]),
    [],
  )
  const removeFamily = useCallback((id: string) => setFamilies((f) => f.filter((x) => x.id !== id)), [])

  const value = useMemo(
    () => ({ families, letters, addLetter, updateLetter, updateFamily, addFamily, removeFamily }),
    [families, letters, addLetter, updateLetter, updateFamily, addFamily, removeFamily],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
