import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { AppContext, type AppState } from './useStore'
import type { Reporte, Area, User } from '@/types'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('pbi_user')
    return u ? JSON.parse(u) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pbi_token'))
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('resumen')
  const [dirFilter, setDirFilter] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [colFilter, setColFilter] = useState('')
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pbi_dark')
    if (saved !== null) return saved === '1'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const applyTheme = useCallback((dark: boolean) => {
    document.documentElement.classList.toggle('dark', dark)

    // Direct inline style on <html> — highest CSS priority
    const s = document.documentElement.style
    if (dark) {
      s.setProperty('--color-surface-0',   '24 24 27')
      s.setProperty('--color-surface-50',  '18 18 21')
      s.setProperty('--color-surface-100', '35 35 40')
      s.setProperty('--color-surface-200', '50 50 56')
      s.setProperty('--color-surface-300', '70 70 76')
      s.setProperty('--color-ink-900', '244 244 245')
      s.setProperty('--color-ink-700', '212 212 216')
      s.setProperty('--color-ink-500', '161 161 170')
      s.setProperty('--color-ink-400', '113 113 122')
      s.setProperty('--color-ink-300', '63 63 70')
      s.setProperty('--color-brand-50',  '8 47 24')
      s.setProperty('--color-brand-100', '12 62 32')
      s.setProperty('--color-brand-200', '20 83 45')
      s.setProperty('--color-brand-300', '21 128 61')
      s.setProperty('--color-brand-400', '34 197 94')
      s.setProperty('--color-brand-500', '34 197 94')
      s.setProperty('--color-brand-600', '74 222 128')
      s.setProperty('--color-brand-700', '134 239 172')
      s.setProperty('--color-brand-800', '187 247 208')
      s.setProperty('--color-brand-900', '220 252 231')
      s.setProperty('--color-brand-950', '240 253 244')
      s.setProperty('--shadow-soft',  '0 1px 3px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.2)')
      s.setProperty('--shadow-card',  '0 2px 8px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.2)')
      s.setProperty('--shadow-float', '0 4px 16px rgba(0,0,0,.4), 0 12px 40px rgba(0,0,0,.3)')
      s.setProperty('--shadow-glow',  '0 0 20px rgba(34,197,94,.25)')
      s.setProperty('--scrollbar-thumb', '#52525b')
      s.setProperty('--scrollbar-hover', '#71717a')
    } else {
      // Remove all overrides — falls back to :root in CSS
      const keys = [
        '--color-surface-0','--color-surface-50','--color-surface-100','--color-surface-200','--color-surface-300',
        '--color-ink-900','--color-ink-700','--color-ink-500','--color-ink-400','--color-ink-300',
        '--color-brand-50','--color-brand-100','--color-brand-200','--color-brand-300','--color-brand-400',
        '--color-brand-500','--color-brand-600','--color-brand-700','--color-brand-800','--color-brand-900','--color-brand-950',
        '--shadow-soft','--shadow-card','--shadow-float','--shadow-glow','--scrollbar-thumb','--scrollbar-hover',
      ]
      keys.forEach(k => s.removeProperty(k))
    }

    // DEBUG: verify
    const val = getComputedStyle(document.documentElement).getPropertyValue('--color-surface-0')
    console.log('THEME APPLIED:', dark ? 'DARK' : 'LIGHT', '| --color-surface-0 =', JSON.stringify(val))
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('pbi_dark', next ? '1' : '0')
      applyTheme(next)
      return next
    })
  }, [applyTheme])

  useEffect(() => {
    applyTheme(darkMode)
  }, [darkMode, applyTheme])

  const login = useCallback((t: string, u: User) => {
    setToken(t)
    setUser(u)
    localStorage.setItem('pbi_token', t)
    localStorage.setItem('pbi_user', JSON.stringify(u))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('pbi_token')
    localStorage.removeItem('pbi_user')
  }, [])

  const updateReporte = useCallback((r: Reporte) => {
    setReportes(prev => prev.map(x => (x.id === r.id ? r : x)))
  }, [])

  const removeReporte = useCallback((id: string) => {
    setReportes(prev => prev.filter(x => x.id !== id))
  }, [])

  const addReporte = useCallback((r: Reporte) => {
    setReportes(prev => [...prev, r])
  }, [])

  const showToast = useCallback((msg: string, icon = '\u2713') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, icon })
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const value: AppState = {
    user, token, login, logout,
    reportes, areas, setReportes, setAreas,
    updateReporte, removeReporte, addReporte,
    activeId, activeTab, dirFilter, searchQ, colFilter,
    setActiveId, setActiveTab, setDirFilter, setSearchQ, setColFilter,
    darkMode, toggleDarkMode,
    toast, showToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
