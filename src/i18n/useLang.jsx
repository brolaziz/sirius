import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import uz from './uz.json'
import en from './en.json'
import { useAuth } from '../lib/useAuth'

const DICTS = { uz, en }
const LANGS = ['uz', 'en']
const KEY = 'sirius.lang'

const LangCtx = createContext(null)

const readLocal = () => {
  try {
    const v = localStorage.getItem(KEY)
    return LANGS.includes(v) ? v : 'uz'
  } catch { return 'uz' }
}

export function LangProvider({ children }) {
  const { profile, patchProfile } = useAuth()
  const [lang, setLangState] = useState(readLocal)

  // Firestore is the source of truth once the profile arrives; localStorage is
  // only a cache so the first paint is not in the wrong language.
  useEffect(() => {
    if (profile?.lang && LANGS.includes(profile.lang) && profile.lang !== lang) {
      setLangState(profile.lang)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.lang])

  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem(KEY, lang) } catch { /* private mode */ }
  }, [lang])

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return
    setLangState(next)
    patchProfile({ lang: next })
  }, [patchProfile])

  const value = useMemo(() => {
    const dict = DICTS[lang]
    // Missing key renders the key itself — loud in dev, harmless in the demo.
    const t = (key, vars) => {
      let s = dict[key] ?? en[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)
      return s
    }
    return { lang, setLang, t, toggle: () => setLang(lang === 'uz' ? 'en' : 'uz') }
  }, [lang, setLang])

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}

export function useLang() {
  const ctx = useContext(LangCtx)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}
