import { useState, useEffect, useRef } from 'react'
import { Bell, Settings, Check, CheckCheck, FileText, Upload, RefreshCw } from 'lucide-react'
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

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const dropRef = useRef<HTMLDivElement>(null)

  const tabLabels: Record<string, string> = {
    resumen: 'Resumen', modelo: 'Modelo', columnas: 'Columnas',
    medidas: 'Medidas DAX', fuente: 'Fuente', pdf: 'Vista PDF',
    notificaciones: 'Notificaciones',
    guia: 'Guia de Uso',
  }

  // Load notifications
  async function loadNotifications() {
    try {
      const data = await apiFetch<{ items: Notification[]; unread: number }>('/notifications')
      setNotifications(data.items)
      setUnread(data.unread)
    } catch (e) { console.error('Notifications load error:', e) }
  }

  // Poll every 15s + reload when reportes change
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [reportes.length])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

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
      setOpen(false)
    }
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
    <header className="h-12 border-b border-surface-200/60 bg-surface-0/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-5 gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs min-w-0">
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

      <div className="flex-1" />

      {/* Welcome */}
      <span className="text-xs text-ink-700 font-semibold shrink-0">Bienvenido/a, {firstName}</span>

      {/* Notifications */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => { setOpen(!open); if (!open) loadNotifications() }}
          className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all relative"
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-[380px] bg-surface-0 border border-surface-200 rounded-2xl shadow-float z-50 overflow-hidden">
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

            {/* Footer - Ver todas */}
            {notifications.length > 0 && (
              <div className="border-t border-surface-100 px-4 py-2.5">
                <button
                  onClick={() => { setActiveTab('notificaciones'); setOpen(false) }}
                  className="w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onOpenUserMenu}
        className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-all"
      >
        <Settings size={15} />
      </button>
    </header>
  )
}
