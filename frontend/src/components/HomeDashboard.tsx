import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '@/store/useStore'
import { apiFetch } from '@/api/client'
import {
  FileText, CheckCircle, Clock, Layers, TrendingUp,
  Activity, ArrowUpRight, ArrowDownRight,
  BarChart3, Users
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
  create_reporte: 'Creado',
  update_reporte: 'Actualizado',
  delete_reporte: 'Eliminado',
  login: 'Inicio sesión',
  create_user: 'Usuario creado',
  update_user: 'Usuario editado',
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

export function HomeDashboard() {
  const store = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch stats and audit log
  useEffect(() => {
    async function fetchData() {
      try {
        const statsData = await apiFetch<StatsData>('/stats')
        setStats(statsData)

        if (store.user?.role === 'admin') {
          try {
            const logData = await apiFetch<AuditLog>('/audit-log?limit=10')
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
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out' },
    )
  }, [])

  if (loading) {
    return (
      <div className="p-4 lg:p-5 space-y-4">
        {/* Skeleton cards */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-100 animate-pulse" />
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

  return (
    <div ref={containerRef} className="p-4 lg:p-5 space-y-5">
      {/* Welcome Banner */}
      <WelcomeBanner user={store.user?.name} stats={statsData} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={FileText}
          label="Reportes Documentados"
          value={statsData.total_reportes}
          color="bg-brand-50"
          iconColor="text-brand-600"
          hex="#16a34a"
        />
        <KPICard
          icon={CheckCircle}
          label="Activos"
          value={activos}
          color="bg-emerald-50"
          iconColor="text-emerald-600"
          hex="#10b981"
        />
        <KPICard
          icon={Clock}
          label="En Desarrollo"
          value={enDesarrollo}
          color="bg-amber-50"
          iconColor="text-amber-600"
          hex="#f59e0b"
        />
        <KPICard
          icon={Layers}
          label="Áreas Cubiertas"
          value={statsData.total_areas}
          color="bg-blue-50"
          iconColor="text-blue-600"
          hex="#3b82f6"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Reportes por Dirección" data={statsData.by_direccion} type="bar" />
        <ChartCard title="Distribución por Estado" data={statsData.by_estado} type="donut" />
      </div>

      {/* Recent Reports */}
      <RecentReports reportes={store.reportes} />

      {/* Activity Feed */}
      {store.user?.role === 'admin' && auditLog && (
        <ActivityFeed logs={auditLog.items} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*                          Sub-components                             */
/* ═══════════════════════════════════════════════════════════════════ */

function WelcomeBanner({ user, stats }: { user?: string; stats: StatsData }) {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
      style={{
        background: 'linear-gradient(160deg, #0f4c2a 0%, #14532d 35%, #166534 70%, #1a7a40 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute -top-20 -right-20 w-[320px] h-[320px] opacity-[0.07]" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="140" fill="none" stroke="white" strokeWidth="20" />
        </svg>
      </div>

      <div className="relative z-10">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
          ¡Bienvenido, {user || 'Administrador'}! 👋
        </h1>
        <p className="text-white/60 text-sm mb-6">{today}</p>

        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            <span className="text-white/90 text-sm font-medium">{stats.total_reportes} en el catálogo</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <TrendingUp size={14} className="text-white/70" />
            <span className="text-white/90 text-sm font-medium">Sistema operacional</span>
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
  iconColor,
  hex,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  iconColor: string
  hex: string
}) {
  const valueRef = useRef<HTMLDivElement>(null)

  // Counter animation
  useEffect(() => {
    if (!valueRef.current) return
    gsap.to(valueRef.current, {
      textContent: value,
      duration: 1.2,
      ease: 'power2.out',
      snap: { textContent: 1 },
    })
  }, [value])

  return (
    <div className="card p-5 flex flex-col justify-between h-full group cursor-default transition-shadow hover:shadow-card">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center ${iconColor} mb-4`}>
        <Icon size={20} />
      </div>
      <div>
        <div
          ref={valueRef}
          className="text-3xl font-extrabold font-mono leading-none"
          style={{ color: hex }}
        >
          {value}
        </div>
        <p className="text-xs text-ink-400 uppercase tracking-wider font-semibold mt-2">
          {label}
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
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    if (Object.keys(data).length === 0) return

    const width = 400
    const height = 250

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)

    if (type === 'bar') {
      // Horizontal bar chart
      const margin = { top: 20, right: 20, bottom: 20, left: 120 }
      const chartWidth = width - margin.left - margin.right
      const chartHeight = height - margin.top - margin.bottom

      const entries = Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)

      const yScale = d3
        .scaleBand()
        .domain(entries.map(([k]) => k))
        .range([0, chartHeight])
        .padding(0.4)

      const xScale = d3
        .scaleLinear()
        .domain([0, Math.max(...entries.map(([, v]) => v))])
        .range([0, chartWidth])

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Bars
      g.selectAll('rect')
        .data(entries)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', ([k]) => yScale(k) ?? 0)
        .attr('width', 0)
        .attr('height', yScale.bandwidth())
        .attr('fill', '#16a34a')
        .attr('rx', 4)
        .transition()
        .duration(800)
        .attr('width', ([, v]) => xScale(v))

      // Labels
      g.selectAll('text')
        .data(entries)
        .enter()
        .append('text')
        .attr('x', -8)
        .attr('y', ([k]) => (yScale(k) ?? 0) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#595959')
        .attr('font-weight', '600')
        .text(([k]) => k)
    } else if (type === 'donut') {
      // Donut chart
      const radius = Math.min(width, height) / 2 - 30
      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)

      const pie = d3.pie<[string, number]>().value(([, v]) => v)
      const arc = d3.arc<any>()
        .innerRadius(radius * 0.65)
        .outerRadius(radius)

      const colors: Record<string, string> = {
        activo: '#16a34a',
        desarrollo: '#f59e0b',
        deprecado: '#ef4444',
      }

      const arcs = pie(Object.entries(data))

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

      // Center label
      const total = Object.values(data).reduce((a, b) => a + b, 0)
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1f2937')
        .text(total)

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .attr('font-size', '11px')
        .attr('fill', '#999')
        .text('reportes')
    }
  }, [data, type])

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">{title}</h3>
      </div>
      <div className="flex justify-center">
        <svg ref={svgRef} width={400} height={250} style={{ maxWidth: '100%' }} />
      </div>
    </div>
  )
}

function RecentReports({ reportes }: { reportes: any[] }) {
  const { setActiveId, setActiveTab } = useStore()

  const recent = reportes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  if (recent.length === 0) {
    return null
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">Reportes Recientes</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {recent.map(r => (
          <div
            key={r.id}
            onClick={() => {
              setActiveId(r.id)
              setActiveTab('resumen')
            }}
            className="p-3 rounded-xl bg-surface-50 border border-surface-100 cursor-pointer transition-all hover:border-brand-300 hover:bg-brand-50/30 group"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl">{r.emoji || '📊'}</span>
              <EstadoBadge estado={r.estado} />
            </div>
            <p className="text-xs font-semibold text-ink-900 line-clamp-2 mb-1 group-hover:text-brand-700 transition-colors">
              {r.name}
            </p>
            {r.area && <p className="text-2xs text-ink-400">{r.area}</p>}
            <p className="text-2xs text-ink-300 mt-2">{relativeTime(r.updatedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityFeed({ logs }: { logs: any[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-ink-500" />
        <h3 className="text-sm font-bold text-ink-900">Actividad Reciente</h3>
        <span className="text-2xs text-ink-300 ml-auto">Admin</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              {['Hora', 'Usuario', 'Acción', 'Elemento'].map(h => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="border-b border-surface-100/60 last:border-0 hover:bg-surface-50 transition-colors">
                <td className="px-3 py-2.5 text-2xs text-ink-500 whitespace-nowrap">
                  {relativeTime(log.created_at)}
                </td>
                <td className="px-3 py-2.5 text-2xs text-ink-700 font-medium">{log.user_name}</td>
                <td className="px-3 py-2.5">
                  <span className="text-2xs font-semibold px-2 py-1 rounded-full bg-brand-50 text-brand-700">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-2xs text-ink-500 font-mono truncate max-w-xs">
                  {log.target_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
