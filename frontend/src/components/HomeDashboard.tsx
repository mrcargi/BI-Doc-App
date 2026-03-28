import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'
import {
  FileText, CheckCircle, Clock, Layers, TrendingUp, TrendingDown,
  Activity, ArrowUpRight, AlertCircle, Zap, Shield,
  BarChart3, Users, User, Search, CheckSquare, AlertTriangle
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

function getInitials(name?: string): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

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
            const logData = await apiFetch<AuditLog>('/audit-log?limit=12')
            setAuditLog(logData)
          } catch {
            // Graceful fallback for non-admin
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [store.user?.role])

  // GSAP stagger animation on mount
  useEffect(() => {
    if (!containerRef.current) return
    const children = containerRef.current.children
    gsap.fromTo(
      children,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out' },
    )
  }, [])

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const statsData = stats || {
    total_reportes: 0,
    total_areas: 0,
    by_estado: { activo: 0, desarrollo: 0, deprecado: 0 },
    by_direccion: {},
  }

  const activos = statsData.by_estado.activo || 0
  const enDesarrollo = statsData.by_estado.desarrollo || 0
  const deprecado = statsData.by_estado.deprecado || 0

  // Simulated contributors from audit log
  const contributors = auditLog?.items
    ? [...new Map(auditLog.items.map(item => [item.user_name, item.user_name])).values()].slice(0, 5)
    : []

  return (
    <div ref={containerRef} className="p-4 lg:p-6 space-y-6">
      {/* Welcome Banner — Compacto y elegante */}
      <WelcomeBanner user={store.user?.name} activos={activos} areas={statsData.total_areas} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={FileText}
          label="Reportes Documentados"
          value={statsData.total_reportes}
          color="#16a34a"
          trend="+8%"
          borderColor="border-t-brand-600"
        />
        <KPICard
          icon={CheckCircle}
          label="Activos"
          value={activos}
          color="#10b981"
          trend="+5%"
          borderColor="border-t-emerald-500"
        />
        <KPICard
          icon={Clock}
          label="En Desarrollo"
          value={enDesarrollo}
          color="#d97706"
          trend={enDesarrollo > 5 ? "-2%" : "0%"}
          borderColor="border-t-amber-500"
        />
        <KPICard
          icon={Layers}
          label="Áreas Cubiertas"
          value={statsData.total_areas}
          color="#3b82f6"
          trend="+1"
          borderColor="border-t-blue-500"
        />
      </div>

      {/* Quick Stats Row — Salud del Sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <HealthCard
          icon={CheckSquare}
          label="Completitud"
          value={`${Math.round((statsData.total_reportes / Math.max(statsData.total_reportes + 5, 1)) * 100)}%`}
          status="excellent"
        />
        <HealthCard
          icon={Zap}
          label="Actividad"
          value={`${auditLog?.items.length || 0} cambios`}
          status="active"
        />
        <HealthCard
          icon={Shield}
          label="Estado"
          value="Operacional"
          status="healthy"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Reportes por Dirección" data={statsData.by_direccion} type="bar" />
        <ChartCard title="Distribución por Estado" data={statsData.by_estado} type="donut" />
      </div>

      {/* Two Column Section: Recientes + Documentación Pendiente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentReports reportes={store.reportes} />
        <DocumentationStatus reportes={store.reportes} />
      </div>

      {/* Contributors Section */}
      {contributors.length > 0 && (
        <ContributorsSection contributors={contributors} logs={auditLog?.items || []} />
      )}

      {/* Activity Feed */}
      {store.user?.role === 'admin' && auditLog && (
        <ActivityFeed logs={auditLog.items} />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */

function WelcomeBanner({ user, activos, areas }: { user?: string; activos: number; areas: number }) {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(160deg, #0f4c2a 0%, #166534 70%, #1a7a40 100%)',
      }}
    >
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <svg width="100%" height="100%" className="absolute">
          <defs>
            <pattern id="dots" x="16" y="16" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative z-10 flex items-start justify-between gap-6">
        {/* Left: Greeting + Date */}
        <div>
          <h1 className="text-xl font-bold text-white">
            ¡Bienvenido, {user || 'Administrador'}!
          </h1>
          <p className="text-2xs text-white/50 mt-1 font-medium uppercase tracking-wider">{today}</p>
        </div>

        {/* Right: Metric Pills */}
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span className="text-white/90 text-2xs font-semibold">{activos} activos</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <ArrowUpRight size={11} className="text-white/70" />
            <span className="text-white/90 text-2xs font-semibold">{areas} áreas</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  borderColor,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  trend: string
  borderColor: string
}) {
  const valueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!valueRef.current) return
    gsap.to(valueRef.current, {
      textContent: value,
      duration: 0.8,
      ease: 'power2.out',
      snap: { textContent: 1 },
    })
  }, [value])

  const isTrendPositive = trend.startsWith('+') || !trend.includes('-')

  return (
    <div className={`card p-5 flex flex-col justify-between h-full group transition-all hover:shadow-card ${borderColor} border-t-[3px]`}>
      {/* Top right: icon */}
      <div className="flex justify-end mb-4">
        <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center" style={{ color }}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>

      {/* Middle: value */}
      <div>
        <div
          ref={valueRef}
          className="text-4xl font-black leading-none mb-1"
          style={{ color }}
        >
          {value}
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-1.5 mb-3">
          {isTrendPositive ? (
            <TrendingUp size={13} className="text-emerald-600" />
          ) : (
            <TrendingDown size={13} className="text-amber-600" />
          )}
          <span className={`text-2xs font-semibold ${isTrendPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
            {trend}
          </span>
        </div>
      </div>

      {/* Label */}
      <p className="text-2xs text-ink-400 uppercase tracking-wider font-semibold leading-tight">
        {label}
      </p>
    </div>
  )
}

function HealthCard({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: React.ElementType
  label: string
  value: string
  status: 'excellent' | 'active' | 'healthy'
}) {
  const statusColors = {
    excellent: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
    active: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', dot: 'bg-blue-500' },
    healthy: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', dot: 'bg-green-500' },
  }

  const colors = statusColors[status]

  return (
    <div className={`card border ${colors.border} ${colors.bg} p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xs text-ink-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm font-bold text-ink-900 flex items-center gap-2 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          {value}
        </p>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  data,
  type,
}: {
  title: string
  data: Record<string, number>
  type: 'bar' | 'donut'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || Object.keys(data).length === 0) return

    const width = 450
    const height = 280

    d3.select(svgRef.current).selectAll('*').remove()
    const svg = d3.select(svgRef.current)

    if (type === 'bar') {
      const margin = { top: 20, right: 30, bottom: 20, left: 160 }
      const chartWidth = width - margin.left - margin.right
      const chartHeight = height - margin.top - margin.bottom

      const entries = Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)

      const maxValue = Math.max(...entries.map(([, v]) => v))

      const yScale = d3.scaleBand()
        .domain(entries.map(([k]) => k))
        .range([0, chartHeight])
        .padding(0.35)

      const xScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, chartWidth])

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Subtle grid lines
      g.selectAll('line.grid')
        .data(d3.ticks(0, maxValue, 4))
        .enter()
        .append('line')
        .attr('class', 'grid')
        .attr('x1', (d: number) => xScale(d))
        .attr('x2', (d: number) => xScale(d))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#f0f0f0')
        .attr('stroke-width', 1)

      // Color gradient palette
      const colors = ['#0f4c2a', '#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']

      // Bars with animation
      g.selectAll('rect')
        .data(entries)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', ([k]) => yScale(k) ?? 0)
        .attr('width', 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', (_, i) => colors[i % colors.length])
        .attr('rx', 5)
        .transition()
        .duration(800)
        .attr('width', ([, v]) => xScale(v))

      // Labels (larger and clearer)
      g.selectAll('text.label')
        .data(entries)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', -8)
        .attr('y', ([k]) => (yScale(k) ?? 0) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('font-size', '13px')
        .attr('fill', '#6b7280')
        .attr('font-weight', '500')
        .text(([k]) => k)

      // Values at end of bars
      g.selectAll('text.value')
        .data(entries)
        .enter()
        .append('text')
        .attr('class', 'value')
        .attr('x', ([, v]) => xScale(v) + 6)
        .attr('y', ([k]) => (yScale(k) ?? 0) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', (_, i) => colors[i % colors.length])
        .text(([, v]) => v)
    } else if (type === 'donut') {
      // Donut + Legend layout
      const donutRadius = 60
      const donutX = 100
      const donutY = 140

      const g = svg.append('g')
        .attr('transform', `translate(${donutX},${donutY})`)

      const pie = d3.pie<[string, number]>().value(([, v]) => v)
      const arc = d3.arc<any>()
        .innerRadius(donutRadius * 0.65)
        .outerRadius(donutRadius)

      const colors: Record<string, string> = {
        activo: '#16a34a',
        desarrollo: '#d97706',
        deprecado: '#9ca3af',
      }

      const arcs = pie(Object.entries(data))
      const total = Object.values(data).reduce((a, b) => a + b, 0)

      // Draw donut segments
      g.selectAll('path')
        .data(arcs as any)
        .enter()
        .append('path')
        .attr('fill', (d: any) => colors[d.data[0]] || '#ccc')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .transition()
        .duration(900)
        .ease(d3.easeQuadInOut)
        .attr('d', (d: any) => arc(d))

      // Center text
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1f2937')
        .text(total)

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .attr('font-size', '11px')
        .attr('fill', '#9ca3af')
        .text('reportes')

      // Legend (right side)
      const legendX = 240
      const items = Object.entries(data).map(([label, value]) => ({
        label,
        value,
        pct: Math.round((value / total) * 100),
        color: colors[label],
      }))

      items.forEach((item, i) => {
        const y = 80 + i * 45

        // Dot
        svg.append('circle')
          .attr('cx', legendX)
          .attr('cy', y)
          .attr('r', 4)
          .attr('fill', item.color)

        // Label
        svg.append('text')
          .attr('x', legendX + 12)
          .attr('y', y)
          .attr('dy', '0.35em')
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .attr('fill', '#1f2937')
          .text(item.label.charAt(0).toUpperCase() + item.label.slice(1))

        // Value + Percentage
        svg.append('text')
          .attr('x', legendX + 12)
          .attr('y', y + 14)
          .attr('font-size', '11px')
          .attr('fill', '#9ca3af')
          .text(`${item.value} (${item.pct}%)`)
      })
    }
  }, [data, type])

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">{title}</h3>
      </div>
      <div className="flex justify-center -ml-4">
        <svg ref={svgRef} width={450} height={280} style={{ maxWidth: '100%' }} />
      </div>
    </div>
  )
}

function RecentReports({ reportes }: { reportes: any[] }) {
  const { setActiveId, setActiveTab } = useStore()

  const recent = reportes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  if (recent.length === 0) {
    return null
  }

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
        <Activity size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">Reportes Recientes</h3>
        <span className="text-2xs text-ink-300 ml-auto">últimos {recent.length}</span>
      </div>
      <div className="divide-y divide-surface-100">
        {recent.map(r => (
          <div
            key={r.id}
            onClick={() => {
              setActiveId(r.id)
              setActiveTab('resumen')
            }}
            className="px-5 py-3 flex items-center gap-3 cursor-pointer transition-all hover:bg-surface-50 group"
          >
            {/* Emoji */}
            <span className="text-xl shrink-0">{r.emoji || '📊'}</span>

            {/* Name + Area */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-900 group-hover:text-brand-700 transition-colors truncate">
                {r.name}
              </p>
              {r.area && <p className="text-2xs text-ink-400">{r.area}</p>}
            </div>

            {/* Status badge */}
            <div className="shrink-0">
              <EstadoBadge estado={r.estado} />
            </div>

            {/* Time */}
            <span className="text-2xs text-ink-400 whitespace-nowrap">{relativeTime(r.updatedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DocumentationStatus({ reportes }: { reportes: any[] }) {
  // Calcular reportes incompletos (sin descripción o sin tablas)
  const incomplete = reportes.filter(r => !r.desc || !r.tables || r.tables.length === 0).slice(0, 5)
  const completeness = Math.round(((reportes.length - incomplete.length) / Math.max(reportes.length, 1)) * 100)

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500" />
        <h3 className="text-sm font-bold text-ink-900">Documentación Pendiente</h3>
        <span className="text-2xs text-ink-300 ml-auto">{incomplete.length} reportes</span>
      </div>
      <div className="p-5 space-y-3">
        {incomplete.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-ink-700">¡Todo documentado!</p>
            <p className="text-2xs text-ink-400 mt-1">{completeness}% completitud</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold text-ink-600 uppercase">Completitud General</span>
              <span className="text-sm font-bold text-amber-600">{completeness}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>

            <div className="pt-2 space-y-2">
              {incomplete.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink-900 truncate">{r.name}</p>
                    <p className="text-2xs text-amber-700">Falta documentación</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ContributorsSection({ contributors, logs }: { contributors: string[]; logs: any[] }) {
  const colors = ['bg-brand-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500']
  const recentLogs = logs.slice(0, 5)

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
        <Users size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">Contribuidores Activos</h3>
        <span className="text-2xs text-ink-300 ml-auto">{contributors.length} usuarios</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          {contributors.map((name, i) => (
            <div
              key={name}
              className={`w-8 h-8 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-white text-2xs font-bold`}
              title={name}
            >
              {getInitials(name)}
            </div>
          ))}
        </div>

        {/* Activity summary */}
        <div className="space-y-2">
          {recentLogs.map((log, i) => {
            const actionColor = ACTION_COLORS[log.action] || '#6b7280'
            return (
              <div key={i} className="flex items-start gap-2 text-2xs">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: actionColor }} />
                <p className="text-ink-700">
                  <span className="font-semibold">{log.user_name}</span> {ACTION_LABELS[log.action] || 'modificó'} <span className="text-ink-500 font-mono">{log.target_id}</span>
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ActivityFeed({ logs }: { logs: any[] }) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
        <Activity size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">Historial Completo</h3>
        <span className="text-2xs text-ink-300 ml-auto">últimas {logs.length}</span>
      </div>

      {/* Timeline */}
      <div className="p-5 space-y-3">
        {logs.slice(0, 10).map((log, i) => {
          const dotColor = ACTION_COLORS[log.action] || '#6b7280'

          return (
            <div key={i} className="flex items-start gap-3 group">
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-0.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
                {i < logs.length - 1 && (
                  <div className="w-px h-8 bg-surface-200 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-xs text-ink-700 font-medium">
                  <span className="font-bold text-ink-900">{log.user_name}</span>
                  {' '}
                  <span className="text-ink-600">{ACTION_LABELS[log.action] || log.action}</span>
                </p>
                <p className="text-2xs text-ink-400 mt-0.5">
                  {log.target_id}
                </p>
                <span className="text-2xs text-ink-300 inline-block mt-1">
                  {relativeTime(log.created_at)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
