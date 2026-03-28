import { useState, useEffect, useRef } from 'react'
import { Bell, Settings, Check, CheckCheck, FileText, Upload, RefreshCw, Search, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  reporte_id: string | null
  is_read: number
  created_at: string
}

interface TopBarProps {
  onOpenUserMenu: () => void
}

export function TopBar({ onOpenUserMenu }: TopBarProps) {
  const { reportes, activeId, activeTab, setActiveId, setActiveTab, user } = useStore()
  const doc = reportes.find(r => r.id === activeId)
  const firstName = user?.name?.split(' ')[0] || 'Usuario'

  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const notifDropRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const tabLabels: Record<string, string> = {
    resumen: 'Resumen', modelo: 'Modelo', columnas: 'Columnas',
    medidas: 'Medidas DAX', fuente: 'Fuente', pdf: 'Vista PDF',
    notificaciones: 'Notificaciones',
    guia: 'Guia de Uso',
  }

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? reportes.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : []

  // Load notifications
  async function loadNotifications() {
    try {
      const data = await apiFetch<{ items: Notification[]; unread: number }>('/notifications')
      setNotifications(data.items)
      setUnread(data.unread)
    } catch (e) { console.error('Notifications load error:', e) }
  }

  // Poll notifications
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [reportes.length])

  // Close dropdowns on outside click
  useEffect(() => {
    if (!notifOpen && !searchOpen) return
    function handleClick(e: MouseEvent) {
      if (notifDropRef.current && !notifDropRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen, searchOpen])

  // Focus search input
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnread(0)
    } catch { /* ignore */ }
  }

  async function markRead(id: number) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  function handleNotifClick(n: Notification) {
    if (!n.is_read) markRead(n.id)
    if (n.reporte_id) {
      setActiveId(n.reporte_id)
      setActiveTab('resumen')
      setNotifOpen(false)
    }
  }

  function handleSearchClick(reporteId: string) {
    setActiveId(reporteId)
    setActiveTab('resumen')
    setSearchOpen(false)
    setSearchQuery('')
  }

  function timeAgo(dateStr: string) {
    const now = new Date()
    const date = new Date(dateStr + 'Z')
    const diffMs = now.getTime() - date.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  }

  function getNotifIcon(type: string) {
    if (type === 'reporte_created') return { icon: Upload, bg: 'bg-brand-50', color: 'text-brand-600' }
    if (type === 'reporte_updated') return { icon: RefreshCw, bg: 'bg-blue-50', color: 'text-blue-600' }
    return { icon: FileText, bg: 'bg-surface-100', color: 'text-ink-500' }
  }

  return (
    <header className="h-13 border-b border-surface-200/60 bg-surface-0/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-5 gap-4">
      {/* Breadcrumb — Left */}
      <div className="flex items-center gap-2 text-xs min-w-0 flex-1">
        {doc && (
          <>
            <span className="text-ink-400 shrink-0">{doc.area || 'PBI Docs'}</span>
            <span className="text-ink-300">›</span>
            <span className="font-semibold text-ink-900 truncate">{doc.name}</span>
            <span className="text-ink-300">›</span>
            <span className="text-brand-600 font-medium">{tabLabels[activeTab] || activeTab}</span>
          </>
        )}
      </div>

      {/* Global Search — Center */}
      <div className="relative w-64" ref={searchRef}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
          searchOpen
            ? 'bg-surface-0 border-brand-300 ring-2 ring-brand-500/10 w-80'
            : 'bg-surface-50 border-surface-200 hover:border-surface-300'
        }`}>
          <Search size={15} className="text-ink-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar reportes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="flex-1 bg-transparent outline-none text-xs text-ink-900 placeholder:text-ink-300"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchOpen(false)
              }}
              className="text-ink-300 hover:text-ink-500 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchOpen && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-surface-0 border border-surface-200 rounded-xl shadow-float z-50 overflow-hidden">
            {searchResults.length === 0 ? (
              <div className="py-6 text-center">
                <Search size={18} className="text-ink-200 mx-auto mb-2" />
                <p className="text-xs text-ink-400">Sin resultados</p>
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSearchClick(r.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface-50 transition-colors border-b border-surface-100/60 last:border-0"
                  >
                    <span className="text-lg">{r.emoji || '📊'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink-900 truncate">{r.name}</p>
                      {r.area && <p className="text-2xs text-ink-400">{r.area}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <div className="relative" ref={notifDropRef}>
        <button
          onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications() }}
          className="w-9 h-9 rounded-xl border border-surface-200 bg-surface-50 flex items-center justify-center text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all relative"
        >
          <Bell size={16} strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 bg-brand-500 text-white text-2xs font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-[400px] bg-surface-0 border border-surface-200 rounded-2xl shadow-float z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink-900">Notificaciones</h3>
                {unread > 0 && (
                  <span className="text-2xs font-bold text-white bg-brand-500 px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-2xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
                >
                  <CheckCheck size={13} /> Marcar todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 && (
                <div className="py-10 text-center">
                  <Bell size={24} className="text-ink-200 mx-auto mb-2" />
                  <p className="text-xs text-ink-400">Sin notificaciones</p>
                </div>
              )}
              {notifications.slice(0, 8).map(n => {
                const { icon: Icon, bg, color } = getNotifIcon(n.type)
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-surface-100/60 last:border-0 ${
                      n.is_read ? 'hover:bg-surface-50' : 'bg-brand-50/30 hover:bg-brand-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={15} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${n.is_read ? 'text-ink-700' : 'text-ink-900'}`}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-2xs text-ink-400 leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-2xs text-ink-300 mt-1 block">{timeAgo(n.created_at)}</span>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(n.id) }}
                        className="w-6 h-6 rounded-md hover:bg-surface-100 flex items-center justify-center text-ink-300 hover:text-brand-600 transition-colors shrink-0 mt-0.5"
                        title="Marcar como leida"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-surface-100 px-4 py-2.5">
                <button
                  onClick={() => { setActiveTab('notificaciones'); setNotifOpen(false) }}
                  className="w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Ver todas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <button
        onClick={onOpenUserMenu}
        className="w-9 h-9 rounded-xl border border-surface-200 bg-surface-50 flex items-center justify-center text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all"
      >
        <Settings size={16} strokeWidth={1.8} />
      </button>
    </header>
  )
}
