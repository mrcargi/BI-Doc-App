import { useState, useEffect } from 'react'
import { Bell, Upload, RefreshCw, FileText, Check, CheckCheck, Calendar, User, Clock, Filter, ChevronDown, ExternalLink } from 'lucide-react'
import { apiFetch } from '@/api/client'
import { useStore } from '@/store/useStore'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  reporte_id: string | null
  is_read: number
  created_at: string
  actor_name: string | null
  actor_email: string | null
  actor_role: string | null
}

export function TabNotificaciones() {
  const { setActiveId, setActiveTab } = useStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterRead, setFilterRead] = useState<string>('')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const data = await apiFetch<{ items: Notification[] }>('/notifications')
      setNotifications(data.items)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function markRead(id: number) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
    } catch { /* ignore */ }
  }

  function goToReport(reporteId: string) {
    setActiveId(reporteId)
    setActiveTab('resumen')
  }

  // Group by date
  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'Z')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Hoy'
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr + 'Z')
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  function getNotifIcon(type: string) {
    if (type === 'reporte_created') return { icon: Upload, bg: 'bg-brand-50', color: 'text-brand-600', border: 'border-l-brand-500' }
    if (type === 'reporte_updated') return { icon: RefreshCw, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-l-blue-500' }
    return { icon: FileText, bg: 'bg-surface-100', color: 'text-ink-500', border: 'border-l-surface-300' }
  }

  function getTypeLabel(type: string) {
    if (type === 'reporte_created') return 'Creacion'
    if (type === 'reporte_updated') return 'Actualizacion'
    return type
  }

  // Apply filters
  const filtered = notifications.filter(n => {
    if (filterType && n.type !== filterType) return false
    if (filterRead === 'unread' && n.is_read) return false
    if (filterRead === 'read' && !n.is_read) return false
    if (filterDate) {
      const nDate = new Date(n.created_at + 'Z').toISOString().split('T')[0]
      if (nDate !== filterDate) return false
    }
    return true
  })

  // Group by date
  const grouped: Record<string, Notification[]> = {}
  filtered.forEach(n => {
    const key = formatDate(n.created_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(n)
  })

  const unreadCount = notifications.filter(n => !n.is_read).length
  const uniqueTypes = [...new Set(notifications.map(n => n.type))]

  return (
    <div className="p-4 lg:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Bell size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900">Notificaciones</h1>
            <p className="text-xs text-ink-400">
              {notifications.length} notificaciones · {unreadCount} sin leer
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn text-xs">
            <CheckCheck size={14} /> Marcar todas como leidas
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card card-body flex items-center gap-3">
        <Filter size={14} className="text-ink-400 shrink-0" />
        <span className="text-xs font-bold text-ink-700 shrink-0">Filtros</span>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="form-input text-xs w-[150px] shrink-0 appearance-none cursor-pointer"
        >
          <option value="">Todos los tipos</option>
          {uniqueTypes.map(t => (
            <option key={t} value={t}>{getTypeLabel(t)}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="form-input text-xs w-[160px] shrink-0 cursor-pointer"
        />

        <select
          value={filterRead}
          onChange={e => setFilterRead(e.target.value)}
          className="form-input text-xs w-[130px] shrink-0 appearance-none cursor-pointer"
        >
          <option value="">Todas</option>
          <option value="unread">No leidas</option>
          <option value="read">Leidas</option>
        </select>

        {(filterType || filterDate || filterRead) && (
          <button
            onClick={() => { setFilterType(''); setFilterDate(''); setFilterRead('') }}
            className="btn text-xs shrink-0"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Notifications grouped by date */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-surface-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center py-16 text-center">
          <Bell size={32} className="text-ink-200 mb-3" />
          <h3 className="text-sm font-semibold text-ink-700 mb-1">Sin notificaciones</h3>
          <p className="text-xs text-ink-400">
            {notifications.length > 0 ? 'No hay resultados con los filtros aplicados.' : 'Las notificaciones apareceran cuando se creen o actualicen reportes.'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateLabel, items]) => (
          <div key={dateLabel}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2 mt-2">
              <Calendar size={13} className="text-ink-400" />
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">{dateLabel}</span>
              <div className="flex-1 h-px bg-surface-200/60" />
              <span className="text-2xs text-ink-300">{items.length} notificaciones</span>
            </div>

            <div className="space-y-2">
              {items.map(n => {
                const { icon: Icon, bg, color, border } = getNotifIcon(n.type)
                return (
                  <div
                    key={n.id}
                    className={`card overflow-hidden border-l-[3px] ${border} transition-all ${
                      n.is_read ? 'opacity-75 hover:opacity-100' : ''
                    }`}
                  >
                    <div className="p-4 flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${n.is_read ? 'text-ink-700' : 'text-ink-900'}`}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                          )}
                          <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${
                            n.type === 'reporte_created' ? 'bg-brand-50 text-brand-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {getTypeLabel(n.type)}
                          </span>
                        </div>

                        <p className="text-xs text-ink-500 leading-relaxed mb-2">{n.message}</p>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-3 text-2xs text-ink-400">
                          {n.actor_name && (
                            <span className="flex items-center gap-1">
                              <User size={11} />
                              <span className="font-medium text-ink-500">{n.actor_name}</span>
                              {n.actor_email && <span className="text-ink-300">({n.actor_email})</span>}
                              {n.actor_role && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  n.actor_role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-surface-100 text-ink-500'
                                }`}>
                                  {n.actor_role}
                                </span>
                              )}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatTime(n.created_at)}
                          </span>
                          {n.reporte_id && (
                            <span className="flex items-center gap-1">
                              <FileText size={11} />
                              <span className="font-mono">{n.reporte_id}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {n.reporte_id && (
                          <button
                            onClick={() => goToReport(n.reporte_id!)}
                            className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-ink-400 hover:text-brand-600 transition-all"
                            title="Ir al reporte"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                        {!n.is_read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-ink-400 hover:text-brand-600 transition-all"
                            title="Marcar como leida"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
