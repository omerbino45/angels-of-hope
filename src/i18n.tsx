import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'he' | 'en'

interface I18n {
  lang: Lang
  t: (he: string, en: string) => string
  toggle: () => void
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('he')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
  }, [lang])

  const t = useCallback((he: string, en: string) => (lang === 'he' ? he : en), [lang])
  const toggle = useCallback(() => setLang((l) => (l === 'he' ? 'en' : 'he')), [])
  const value = useMemo(() => ({ lang, t, toggle }), [lang, t, toggle])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside provider')
  return ctx
}
