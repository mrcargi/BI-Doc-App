import { createContext, useContext } from 'react'
import type { Reporte, Area, User } from '@/types'

export interface AppState {
  // Auth
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void

  // Data
  reportes: Reporte[]
  areas: Area[]
  setReportes: (r: Reporte[]) => void
  setAreas: (a: Area[]) => void
  updateReporte: (r: Reporte) => void
  removeReporte: (id: string) => void
  addReporte: (r: Reporte) => void

  // UI
  activeId: string | null
  activeTab: string
  dirFilter: string
  searchQ: string
  colFilter: string
  setActiveId: (id: string | null) => void
  setActiveTab: (tab: string) => void
  setDirFilter: (dir: string) => void
  setSearchQ: (q: string) => void
  setColFilter: (f: string) => void

  // Theme
  darkMode: boolean
  toggleDarkMode: () => void

  // Toast
  toast: { msg: string; icon: string } | null
  showToast: (msg: string, icon?: string) => void
}

export const AppContext = createContext<AppState | null>(null)

export function useStore(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useStore must be used within AppProvider')
  return ctx
}
