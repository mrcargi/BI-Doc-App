import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import {
  LayoutDashboard, Box, Columns3, FunctionSquare, Database, FileText,
  ChevronLeft, ChevronRight, Plus, Upload, Menu, X, Search, ChevronDown,
  Filter, Check, Bell, BookOpen, Home, User,
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const AREA_COLORS = [
  '#16a34a', '#2563eb', '#9333ea', '#d97706', '#dc2626',
  '#0891b2', '#c026d3', '#059669', '#4f46e5', '#ea580c',
  '#0d9488', '#7c3aed', '#ca8a04', '#e11d48', '#0284c7',
]
const areaColorMap = new Map<string, string>()
function getAreaColor(area: string): string {
  if (!area) return '#6b7280'
  if (areaColorMap.has(area)) return areaColorMap.get(area)!
  let hash = 0
  for (let i = 0; i < area.length; i++) hash = ((hash << 5) - hash + area.charCodeAt(i)) | 0
  const color = AREA_COLORS[Math.abs(hash) % AREA_COLORS.length]
  areaColorMap.set(area, color)
  return color
}

const NAV_ITEMS = [
  { key: 'resumen',  label: 'Resumen',     icon: LayoutDashboard },
  { key: 'modelo',   label: 'Modelo',      icon: Box },
  { key: 'columnas', label: 'Columnas',    icon: Columns3 },
  { key: 'medidas',  label: 'Medidas DAX', icon: FunctionSquare },
  { key: 'fuente',   label: 'Fuente',      icon: Database },
  { key: 'pdf',      label: 'Vista PDF',   icon: FileText },
  { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { key: 'guia',     label: 'Guia de Uso', icon: BookOpen },
]

interface SidebarProps {
  onOpenJsonUpload: () => void
  onOpenCreateModal: () => void
  onOpenUserMenu: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ onOpenJsonUpload, onOpenCreateModal, onOpenUserMenu, collapsed, onToggleCollapse }: SidebarProps) {
  const { activeTab, setActiveTab, user, reportes, areas, activeId, setActiveId, dirFilter, setDirFilter, searchQ, setSearchQ } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [areaDropOpen, setAreaDropOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const sidebarRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const newMenuRef = useRef<HTMLDivElement>(null)
  const areaDropRef = useRef<HTMLDivElement>(null)

  const dirs = [...new Set(areas.map(a => a.nombre))].sort()

  // Filter reportes
  const query = localSearch.toLowerCase()
  const filtered = reportes.filter(r => {
    if (dirFilter && r.direccion !== dirFilter) return false
    if (query) {
      return (r.name || '').toLowerCase().includes(query) ||
             (r.area || '').toLowerCase().includes(query) ||
             (r.id || '').toLowerCase().includes(query)
    }
    return true
  })

  useEffect(() => {
    if (!sidebarRef.current) return
    gsap.to(sidebarRef.current, {
      width: collapsed ? 72 : 300,
      duration: 0.35,
      ease: 'power2.inOut',
    })
  }, [collapsed])

  useEffect(() => {
    if (!overlayRef.current) return
    if (mobileOpen) {
      gsap.to(overlayRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.2 })
    } else {
      gsap.to(overlayRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.2 })
    }
  }, [mobileOpen])

  // Close new menu on outside click
  useEffect(() => {
    if (!newMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [newMenuOpen])

  // Close area dropdown on outside click
  useEffect(() => {
    if (!areaDropOpen) return
    function handleClick(e: MouseEvent) {
      if (areaDropRef.current && !areaDropRef.current.contains(e.target as Node)) {
        setAreaDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [areaDropOpen])

  const handleNavClick = (key: string) => {
    setActiveTab(key)
    if (activeId === null && key !== 'notificaciones' && key !== 'guia') {
      const first = filtered[0] || reportes[0]
      if (first) setActiveId(first.id)
    }
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <img src="/static/img/nadro-logo.png" alt="NADRO" className="h-7" />
          <div className="mt-1">
            <div className="text-sm font-bold text-ink-900 whitespace-nowrap leading-tight">PBI Docs <span className="text-2xs text-ink-400 font-mono font-normal uppercase tracking-widest ml-1">Admin Console</span></div>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg bg-surface-100 items-center justify-center text-ink-400 hover:bg-surface-200 hover:text-ink-700 transition-all shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* New Report button */}
      {!collapsed && (
        <div className="px-3 pt-2 pb-3 relative" ref={newMenuRef}>
          <button
            onClick={() => setNewMenuOpen(!newMenuOpen)}
            className="btn-primary w-full justify-center gap-2"
          >
            <Plus size={16} />
            Nuevo Reporte
            <ChevronDown size={14} className={`ml-auto transition-transform duration-200 ${newMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {newMenuOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-surface-0 border border-surface-200 rounded-xl shadow-float z-30 overflow-hidden">
              <button
                onClick={() => { onOpenCreateModal(); setNewMenuOpen(false); setMobileOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-ink-700 hover:bg-surface-50 transition-colors text-left"
              >
                <Plus size={16} className="text-brand-600" />
                <div>
                  <div className="font-semibold">Crear manual</div>
                  <div className="text-2xs text-ink-400">Llena los datos basicos del reporte</div>
                </div>
              </button>
              <div className="border-t border-surface-100" />
              <button
                onClick={() => { onOpenJsonUpload(); setNewMenuOpen(false); setMobileOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-ink-700 hover:bg-surface-50 transition-colors text-left"
              >
                <Upload size={16} className="text-blue-600" />
                <div>
                  <div className="font-semibold">Subir JSON</div>
                  <div className="text-2xs text-ink-400">Importar documentacion desde Claude</div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapsed: icon-only new button */}
      {collapsed && (
        <div className="px-3 pt-2 pb-3 space-y-1.5">
          <button
            onClick={() => { setActiveId(null); setActiveTab('resumen'); setMobileOpen(false) }}
            className="w-full h-9 rounded-lg bg-surface-100 text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-all flex items-center justify-center"
            title="Home Dashboard"
          >
            <Home size={18} />
          </button>
          <button
            onClick={onOpenCreateModal}
            className="btn-primary w-full justify-center px-0"
            title="Nuevo Reporte"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* Home Dashboard button (expanded) */}
      {!collapsed && (
        <div className="px-3 pt-2 pb-2">
          <button
            onClick={() => { setActiveId(null); setActiveTab('resumen'); setMobileOpen(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border-l-[3px] mb-0.5 ${
              activeId === null
                ? 'bg-brand-50 text-brand-700 border-brand-500'
                : 'text-ink-500 hover:bg-surface-50 hover:text-ink-700 border-transparent'
            }`}
          >
            <Home size={16} className="shrink-0" />
            <span className={`text-[12px] font-medium`}>
              Home
            </span>
          </button>
        </div>
      )}

      {/* REPORTES section */}
      {!collapsed && (
        <>
          <div className="px-4 mb-2">
            <div className="text-2xs font-bold text-ink-400 uppercase tracking-wider mb-2">Reportes</div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-xs text-ink-700 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-500/10 transition-all placeholder:text-ink-300"
              />
            </div>
            {/* Area filter dropdown */}
            {dirs.length > 1 && (
              <div className="relative mt-2" ref={areaDropRef}>
                <button
                  onClick={() => setAreaDropOpen(!areaDropOpen)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs outline-none transition-all cursor-pointer ${
                    dirFilter
                      ? 'bg-brand-50 border-2 border-brand-400 text-brand-700'
                      : 'bg-surface-50 border border-surface-200 text-ink-700 hover:border-surface-300'
                  }`}
                >
                  <Filter size={13} className={dirFilter ? 'text-brand-500' : 'text-ink-300'} />
                  <span className="flex-1 text-left truncate font-medium">
                    {dirFilter || 'Todas las areas'}
                  </span>
                  {dirFilter && (
                    <span
                      onClick={e => { e.stopPropagation(); setDirFilter(''); setAreaDropOpen(false) }}
                      className="w-4 h-4 rounded-full bg-brand-200 flex items-center justify-center hover:bg-brand-300 transition-colors"
                    >
                      <X size={10} className="text-brand-700" />
                    </span>
                  )}
                  <ChevronDown size={13} className={`transition-transform duration-200 ${areaDropOpen ? 'rotate-180' : ''} ${dirFilter ? 'text-brand-500' : 'text-ink-300'}`} />
                </button>

                {areaDropOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-surface-0 border border-surface-200 rounded-xl shadow-float z-30 overflow-hidden max-h-[280px] overflow-y-auto">
                    <button
                      onClick={() => { setDirFilter(''); setAreaDropOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors ${
                        !dirFilter ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-600 hover:bg-surface-50'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                        <LayoutDashboard size={11} className="text-white" />
                      </span>
                      <span className="flex-1">Todas las areas</span>
                      {!dirFilter && <Check size={14} className="text-brand-600" />}
                    </button>
                    <div className="h-px bg-surface-100 mx-2" />
                    {dirs.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => { setDirFilter(d); setAreaDropOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                          dirFilter === d ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-600 hover:bg-surface-50'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                          style={{ background: `hsl(${(i * 37) % 360}, 55%, 55%)` }}
                        >
                          {d.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 truncate">{d}</span>
                        {dirFilter === d && <Check size={14} className="text-brand-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Report list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2">
            {filtered.map(r => {
              const areaColor = getAreaColor(r.area)
              return (
                <button
                  key={r.id}
                  onClick={() => { setActiveId(r.id); if (activeTab === 'notificaciones') setActiveTab('resumen'); setMobileOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all mb-0.5 group border-l-[3px] ${
                    activeId === r.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-500 hover:bg-surface-50 hover:text-ink-700'
                  }`}
                  style={{ borderLeftColor: activeId === r.id ? areaColor : `${areaColor}40` }}
                  title={`${r.name} — ${r.area}`}
                >
                  <FileText size={14} className={`shrink-0 transition-colors`} style={{ color: activeId === r.id ? areaColor : undefined }} />
                  <span className={`text-[12px] truncate ${activeId === r.id ? 'font-semibold' : 'font-medium'}`}>
                    {r.name}
                  </span>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-2xs text-ink-300 text-center py-4">Sin resultados</p>
            )}
          </div>
        </>
      )}

      {/* Collapsed: report icons */}
      {collapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filtered.slice(0, 12).map(r => (
            <button
              key={r.id}
              onClick={() => { setActiveId(r.id); if (activeTab === 'notificaciones') setActiveTab('resumen') }}
              className={`w-full flex items-center justify-center py-2 rounded-lg transition-all ${
                activeId === r.id ? 'bg-brand-50 text-brand-700' : 'text-ink-400 hover:bg-surface-50'
              }`}
              title={r.name}
            >
              <span className="text-sm">{r.emoji || '📊'}</span>
            </button>
          ))}
        </div>
      )}

      {/* NAV section */}
      <div className="px-3 pt-1 pb-1">
        {!collapsed && (
          <div className="text-2xs font-bold text-ink-400 uppercase tracking-wider px-1 mb-1.5">
            Administracion
          </div>
        )}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom: user */}
      <div className="px-3 pb-3 pt-2 mt-auto border-t border-surface-100">
        <div
          onClick={onOpenUserMenu}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer hover:bg-surface-100 transition-all ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center shrink-0">
            <User size={16} className="text-brand-900" />
          </div>
          <div className={`transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="text-xs font-semibold text-ink-900 whitespace-nowrap">{user?.name}</div>
            <div className="text-2xs text-ink-400 whitespace-nowrap capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-surface-0 shadow-card flex items-center justify-center text-ink-700"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 opacity-0 pointer-events-none"
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-[280px] bg-surface-0 border-r border-surface-200 z-50 flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-ink-400 z-10"
        >
          <X size={14} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        ref={sidebarRef}
        className="sidebar-root hidden lg:flex flex-col h-screen bg-surface-0 border-r border-surface-200/80 shrink-0 overflow-hidden sticky top-0 z-10"
        style={{ width: collapsed ? 72 : 300 }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
