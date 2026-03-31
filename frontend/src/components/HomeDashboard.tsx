import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'
import {
  FileText, Download, Filter, BarChart3, CheckCircle, Eye,
  Clock, AlertCircle, Activity, ChevronRight, Lock, TrendingUp,
} from 'lucide-react'
import { EstadoBadge } from '@/components/ui/Badge'
import * as d3 from 'd3'

interface StatsData {
  total_reportes: number
  total_areas: number
  by_estado: Record<string, number>
  by_direccion: Record<string, number>
}

interface AuditLog {
  items: Array<{
    id: number
    user_name: string
    action: string
    target_type: string
    target_id: string
    created_at: string
  }>
}

const ACTION_LABELS: Record<string, string> = {
  create_reporte: 'Creó',
  update_reporte: 'Actualizó',
  delete_reporte: 'Eliminó',
  login: 'Inició sesión',
  create_user: 'Creó usuario',
  update_user: 'Editó usuario',
}

const ACTION_COLORS: Record<string, string> = {
  create_reporte: '#16a34a',
  update_reporte: '#2563eb',
  delete_reporte: '#ef4444',
  login: '#6b7280',
  create_user: '#16a34a',
  update_user: '#2563eb',
}

function relativeTime(isoDate: string): string {
  if (!isoDate) return '—'
  const now = new Date()
  const then = new Date(isoDate)
  const diff = now.getTime() - then.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'hace poco'
  if (mins < 60) return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days < 30) return `hace ${days}d`
  return then.toLocaleDateString('es-MX')
}

/* ════════════════════════════════════════════════════════════════════════ */

export function HomeDashboard() {
  const store = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const statsData = await apiFetch<StatsData>('/stats')
        setStats(statsData)
        if (store.user?.role === 'admin') {
          try {
            const logData = await apiFetch<AuditLog>('/audit-log?limit=15')
            setAuditLog(logData)
          } catch { /* graceful */ }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [store.user?.role])

  useEffect(() => {
    if (!containerRef.current) return
    gsap.fromTo(
      containerRef.current.children,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.05, duration: 0.35, ease: 'power2.out' },
    )
  }, [])

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const sd = stats || { total_reportes: 0, total_areas: 0, by_estado: {}, by_direccion: {} }
  const activos = sd.by_estado.activo || 0
  const enDesarrollo = sd.by_estado.desarrollo || 0
  const deprecated = sd.by_estado.deprecado || 0
  const total = activos + enDesarrollo + deprecated
  const adoptionRate = total > 0 ? Math.round((activos / total) * 100) : 0

  // count updated in last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentCount = store.reportes.filter(
    r => r.updatedAt && new Date(r.updatedAt).getTime() > thirtyDaysAgo
  ).length

  return (
    <div ref={containerRef} className="p-4 lg:p-6 space-y-5">

      {/* ── 1. Compact Executive Header ── */}
      <CompactHeader />

      {/* ── 2. KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          value={activos}
          label="Reportes Activos"
          context={recentCount > 0 ? `+${recentCount} publicados este mes` : 'Operacionales'}
          icon={FileText}
          accentColor="#16a34a"
          badge={{ text: 'Operacional', color: '#16a34a' }}
        />
        <KpiCard
          value={sd.total_areas}
          label="Áreas Cubiertas"
          context={`Tasa de adopción: ${adoptionRate}%`}
          icon={BarChart3}
          accentColor="#2563eb"
        />
        <KpiCard
          value={enDesarrollo}
          label="En Desarrollo"
          context="Pendientes de publicar"
          icon={Clock}
          accentColor="#d97706"
        />
        <KpiCard
          value={deprecated}
          label="Deprecados"
          context="Requieren revisión"
          icon={Lock}
          accentColor="#9ca3af"
        />
      </div>

      {/* ── 3. Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportsByWorkspace data={sd.by_direccion} />
        <StateDistributionChart data={sd.by_estado} />
      </div>

      {/* ── 4. Recently Updated Table ── */}
      <RecentlyUpdated reportes={store.reportes} />

      {/* ── 5. Full Reports Inventory ── */}
      <ReportsInventory reportes={store.reportes} />

      {/* ── 6. Bottom: Action Items + Activity Log (admin only) ── */}
      {store.user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ActionItems reportes={store.reportes} />
          <div className="lg:col-span-2">
            {auditLog && <RecentActivity logs={auditLog.items} />}
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── Compact Header ─────────────────────────────────────────────────── */

function CompactHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-100">
      <div>
        <h1 className="text-xl font-bold text-ink-900 leading-tight">
          Inventario de Reportes BI
        </h1>
        <p className="text-xs text-ink-400 mt-0.5">
          Gobernanza y documentación centralizada · Power BI
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-ink-600 hover:bg-surface-50 transition-colors">
          <Filter size={13} />
          Filtros
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-ink-600 hover:bg-surface-50 transition-colors">
          <Download size={13} />
          Exportar Catálogo
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors">
          <FileText size={13} />
          Ver Reportes
        </button>
      </div>
    </div>
  )
}

/* ─── KPI Card ───────────────────────────────────────────────────────── */

function KpiCard({
  value, label, context, icon: Icon, accentColor, badge,
}: {
  value: number
  label: string
  context: string
  icon: React.ElementType
  accentColor: string
  badge?: { text: string; color: string }
}) {
  return (
    <div
      className="card p-4 hover:shadow-card transition-all"
      style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        {badge && (
          <span
            className="text-2xs font-semibold px-1.5 py-0.5 rounded"
            style={{ color: badge.color, backgroundColor: `${badge.color}15` }}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-ink-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-ink-700 mt-1.5">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <TrendingUp size={10} style={{ color: accentColor }} />
        <p className="text-2xs text-ink-400 leading-snug">{context}</p>
      </div>
    </div>
  )
}

/* ─── Bar Chart: Reports by Workspace ───────────────────────────────── */

function ReportsByWorkspace({ data }: { data: Record<string, number> }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || Object.keys(data).length === 0) return

    const W = 460, H = 210
    d3.select(svgRef.current).selectAll('*').remove()
    const svg = d3.select(svgRef.current)

    const m = { top: 12, right: 40, bottom: 12, left: 145 }
    const cw = W - m.left - m.right
    const ch = H - m.top - m.bottom

    const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 7)
    const maxVal = Math.max(...entries.map(([, v]) => v))

    const yScale = d3.scaleBand().domain(entries.map(([k]) => k)).range([0, ch]).padding(0.5)
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, cw])

    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

    // Subtle vertical grid
    xScale.ticks(4).forEach(t => {
      g.append('line')
        .attr('x1', xScale(t)).attr('x2', xScale(t))
        .attr('y1', 0).attr('y2', ch)
        .attr('stroke', '#f0f0f0').attr('stroke-width', 1)
    })

    const greens = ['#0f4c2a', '#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']

    // Bars
    g.selectAll('rect.bar')
      .data(entries)
      .enter().append('rect').attr('class', 'bar')
      .attr('x', 0)
      .attr('y', ([k]) => yScale(k) ?? 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', (_, i) => greens[i % greens.length])
      .attr('rx', 3)
      .transition().duration(700)
      .attr('width', ([, v]) => xScale(v))

    // Y-axis labels
    g.selectAll('text.label')
      .data(entries)
      .enter().append('text').attr('class', 'label')
      .attr('x', -8)
      .attr('y', ([k]) => (yScale(k) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('font-size', '12px').attr('fill', '#4b5563').attr('font-weight', '500')
      .text(([k]) => k.length > 18 ? k.slice(0, 16) + '…' : k)

    // Value labels
    g.selectAll('text.val')
      .data(entries)
      .enter().append('text').attr('class', 'val')
      .attr('x', ([, v]) => xScale(v) + 5)
      .attr('y', ([k]) => (yScale(k) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '11px').attr('font-weight', '600').attr('fill', '#9ca3af')
      .text(([, v]) => v)
  }, [data])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Reportes por Workspace</h3>
          <p className="text-2xs text-ink-400 mt-0.5">Distribución por dirección / área</p>
        </div>
        <span className="text-2xs text-ink-300">{Object.keys(data).length} workspaces</span>
      </div>
      <svg ref={svgRef} width={460} height={210} style={{ maxWidth: '100%' }} />
    </div>
  )
}

/* ─── Donut Chart: Estado de la Cartera ──────────────────────────────── */

function StateDistributionChart({ data }: { data: Record<string, number> }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const W = 460, H = 210
    d3.select(svgRef.current).selectAll('*').remove()
    const svg = d3.select(svgRef.current)

    const cx = 110, cy = H / 2
    const outerR = 72, innerR = outerR * 0.73  // thin ring

    const colorMap: Record<string, string> = {
      activo: '#16a34a',
      desarrollo: '#d97706',
      deprecado: '#9ca3af',
    }
    const labelMap: Record<string, string> = {
      activo: 'Activo',
      desarrollo: 'En desarrollo',
      deprecado: 'Deprecado',
    }

    const entries = Object.entries(data).filter(([, v]) => v > 0)
    const total = entries.reduce((s, [, v]) => s + v, 0)

    const pie = d3.pie<[string, number]>().value(([, v]) => v).sort(null)
    const arc = d3.arc<any>().innerRadius(innerR).outerRadius(outerR)
    const arcs = pie(entries)

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    g.selectAll('path')
      .data(arcs as any)
      .enter().append('path')
      .attr('fill', (d: any) => colorMap[d.data[0]] || '#e5e7eb')
      .attr('stroke', 'white').attr('stroke-width', 2)
      .transition().duration(800).ease(d3.easeQuadInOut)
      .attr('d', (d: any) => arc(d))

    // Center label
    g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('font-size', '22px').attr('font-weight', '800').attr('fill', '#111827')
      .text(total)
    g.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em')
      .attr('font-size', '9px').attr('letter-spacing', '0.08em').attr('fill', '#9ca3af')
      .text('REPORTES')

    // Legend — right side of donut
    const lx = cx + outerR + 28
    const itemH = 44
    const startY = cy - ((entries.length - 1) * itemH) / 2

    entries.forEach(([key, value], i) => {
      const y = startY + i * itemH
      const pct = total > 0 ? Math.round((value / total) * 100) : 0

      svg.append('rect')
        .attr('x', lx).attr('y', y - 5)
        .attr('width', 10).attr('height', 10).attr('rx', 2)
        .attr('fill', colorMap[key] || '#e5e7eb')

      svg.append('text')
        .attr('x', lx + 15).attr('y', y)
        .attr('dy', '0.15em')
        .attr('font-size', '12px').attr('font-weight', '600').attr('fill', '#374151')
        .text(labelMap[key] || key)

      svg.append('text')
        .attr('x', lx + 15).attr('y', y + 16)
        .attr('font-size', '11px').attr('fill', '#9ca3af')
        .text(`${value} reportes · ${pct}%`)
    })
  }, [data])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Estado de la Cartera</h3>
          <p className="text-2xs text-ink-400 mt-0.5">Ciclo de vida de los reportes</p>
        </div>
      </div>
      <svg ref={svgRef} width={460} height={210} style={{ maxWidth: '100%' }} />
    </div>
  )
}

/* ─── Recently Updated Table ─────────────────────────────────────────── */

function RecentlyUpdated({ reportes }: { reportes: any[] }) {
  const { setActiveId, setActiveTab } = useStore()

  const recent = [...reportes]
    .filter(r => r.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  if (recent.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock size={15} className="text-ink-400" />
          <h3 className="text-sm font-bold text-ink-900">Reportes Recién Actualizados</h3>
        </div>
        <span className="text-2xs text-ink-400">Última actividad</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-100">
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Workspace</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Propietario</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Últ. Actualización</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                <td className="px-5 py-3 font-medium text-ink-900">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.emoji || '📊'}</span>
                    <span className="truncate max-w-[180px]">{r.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-500">{r.area || '—'}</td>
                <td className="px-5 py-3">
                  {r.responsable
                    ? <span className="text-ink-700">{r.responsable}</span>
                    : <span className="text-2xs text-amber-600 font-medium">Sin asignar</span>
                  }
                </td>
                <td className="px-5 py-3"><EstadoBadge estado={r.estado} /></td>
                <td className="px-5 py-3 text-ink-400 text-2xs">{relativeTime(r.updatedAt)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => { setActiveId(r.id); setActiveTab('resumen') }}
                    className="inline-flex items-center gap-1 text-2xs text-brand-600 font-semibold hover:text-brand-800 transition-colors"
                  >
                    <Eye size={12} /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Full Reports Inventory ──────────────────────────────────────────── */

function ReportsInventory({ reportes }: { reportes: any[] }) {
  const { setActiveId, setActiveTab } = useStore()
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'area'>('date')

  const sorted = [...reportes].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'area') return (a.area || '').localeCompare(b.area || '')
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileText size={15} className="text-ink-400" />
          <h3 className="text-sm font-bold text-ink-900">Inventario Completo</h3>
          <span className="text-2xs font-medium px-2 py-0.5 rounded bg-surface-100 text-ink-500">
            {reportes.length} reportes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-ink-400 mr-1.5">Ordenar:</span>
          {(['name', 'area', 'date'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-2xs font-medium px-2.5 py-1 rounded transition-all ${
                sortBy === s
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-500 hover:bg-surface-100'
              }`}
            >
              {s === 'name' ? 'Nombre' : s === 'area' ? 'Workspace' : 'Actualización'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-100">
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Workspace / Área</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Responsable</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-2.5 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Últ. Act.</th>
              <th className="px-5 py-2.5 text-center text-2xs font-semibold text-ink-400 uppercase tracking-wider">Abrir</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.emoji || '📊'}</span>
                    <span className="font-semibold text-ink-900 truncate max-w-[200px]">{r.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-ink-700">{r.area || '—'}</p>
                  {r.direccion && <p className="text-2xs text-ink-400 mt-0.5">{r.direccion}</p>}
                </td>
                <td className="px-5 py-3">
                  {r.responsable
                    ? <span className="text-ink-700">{r.responsable}</span>
                    : <span className="text-2xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">Sin asignar</span>
                  }
                </td>
                <td className="px-5 py-3"><EstadoBadge estado={r.estado} /></td>
                <td className="px-5 py-3 text-ink-400 text-2xs whitespace-nowrap">{relativeTime(r.updatedAt)}</td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => { setActiveId(r.id); setActiveTab('resumen') }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-50 text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-all"
                    title="Ver documentación"
                  >
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Action Items (replaces big alert row) ───────────────────────────── */

function ActionItems({ reportes }: { reportes: any[] }) {
  const { setActiveId, setActiveTab } = useStore()

  const noOwner = reportes.filter(r => !r.responsable)
  const incomplete = reportes.filter(r => !r.desc || !r.tables || r.tables.length === 0)
  const deprecated = reportes.filter(r => r.estado === 'deprecado')

  const items = [
    { key: 'no-owner', label: 'Sin Responsable', count: noOwner.length, color: '#d97706', list: noOwner },
    { key: 'incomplete', label: 'Documentación Incompleta', count: incomplete.length, color: '#ef4444', list: incomplete },
    { key: 'deprecated', label: 'Deprecados — Revisar', count: deprecated.length, color: '#9ca3af', list: deprecated },
  ].filter(item => item.count > 0)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle size={15} className="text-amber-500" />
          <h3 className="text-sm font-bold text-ink-900">Pendientes de Atención</h3>
        </div>
        {items.length > 0 && (
          <span className="text-2xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {items.reduce((s, i) => s + i.count, 0)} items
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle size={22} className="text-brand-500 mx-auto mb-2" />
          <p className="text-xs text-ink-400">Sin tareas pendientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <button
              key={item.key}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-all text-left"
              style={{ borderLeft: `3px solid ${item.color}` }}
              onClick={() => { if (item.list[0]) { setActiveId(item.list[0].id); setActiveTab('resumen') } }}
            >
              <span className="text-xs font-medium text-ink-700">{item.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black" style={{ color: item.color }}>{item.count}</span>
                <ChevronRight size={12} className="text-ink-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Recent Activity Timeline ───────────────────────────────────────── */

function RecentActivity({ logs }: { logs: any[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity size={15} className="text-ink-400" />
          <h3 className="text-sm font-bold text-ink-900">Actividad Reciente</h3>
        </div>
        <span className="text-2xs text-ink-300">{Math.min(logs.length, 15)} eventos</span>
      </div>
      <div className="p-5">
        <div className="relative pl-4">
          <div className="absolute left-0 top-1 bottom-1 w-px bg-surface-100" />
          <div className="space-y-4">
            {logs.slice(0, 15).map((log, i) => {
              const dotColor = ACTION_COLORS[log.action] || '#6b7280'
              return (
                <div key={i} className="relative flex items-start gap-3">
                  <div
                    className="absolute -left-4 top-1.5 w-2 h-2 rounded-full border-2 border-white shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-700 leading-snug">
                      <span className="font-semibold text-ink-900">{log.user_name}</span>
                      {' '}
                      <span>{ACTION_LABELS[log.action] || log.action}</span>
                      {' '}
                      <span className="text-ink-500">{log.target_id}</span>
                    </p>
                    <p className="text-2xs text-ink-300 mt-0.5">{relativeTime(log.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
