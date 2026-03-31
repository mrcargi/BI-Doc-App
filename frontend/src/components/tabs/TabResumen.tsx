import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Settings2, Table2, Columns3, FunctionSquare, Link2, ClipboardList, Database, Calendar, User, Layers, Plug, Wifi, FileType, Globe } from 'lucide-react'
import type { Reporte } from '@/types'
import { TypeBadge, EstadoBadge } from '@/components/ui/Badge'

export function TabResumen({ doc }: { doc: Reporte }) {
  const heroRef = useRef<HTMLDivElement>(null)

  const totalMeasures = (doc.folders || []).reduce((s, f) => s + (f.measures || []).length, 0)
  const activeRels = (doc.relations || []).filter(r => r.active).length
  const tables = doc.tables || []

  useEffect(() => {
    if (!heroRef.current) return
    gsap.fromTo(heroRef.current,
      { scale: 0.97, opacity: 0.3 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity' },
    )
  }, [doc.id])

  return (
    <div className="space-y-4">
      {/* Hero + Metrics — Bento layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Hero card — left */}
        <div
          ref={heroRef}
          className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
          style={{ background: 'linear-gradient(160deg, #0f4c2a 0%, #14532d 35%, #166534 70%, #1a7a40 100%)' }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg className="absolute -top-20 -right-20 w-[320px] h-[320px] opacity-[0.07]" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="140" fill="none" stroke="white" strokeWidth="20" />
            </svg>
            <svg className="absolute top-10 -right-10 w-[200px] h-[200px] opacity-[0.05]" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="15" />
            </svg>
            {/* Abstract data visualization graphic */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-end gap-2 opacity-[0.08]">
              {[65, 40, 85, 55, 95, 45, 70, 50, 80, 60].map((h, i) => (
                <div key={i} className="w-3 rounded-t-sm bg-white" style={{ height: h }} />
              ))}
            </div>
            {/* Dotted grid */}
            <div className="absolute right-4 bottom-4 grid grid-cols-5 gap-3 opacity-[0.06]">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full border border-white/25 text-white/70 text-2xs font-semibold uppercase tracking-[0.15em] mb-5">
                Operational Overview
              </span>

              <h2 className="text-2xl lg:text-[28px] font-extrabold text-white leading-tight mb-2.5 max-w-[70%]">
                {doc.name}
              </h2>

              {doc.desc && (
                <p className="text-white/50 text-[13px] max-w-[65%] leading-relaxed mb-5">{doc.desc}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/25 text-white text-2xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {doc.estado || 'activo'}
              </span>
              {doc.direccion && (
                <span className="px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-2xs font-medium">
                  {doc.direccion}
                </span>
              )}
              {doc.area && (
                <span className="px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-2xs font-medium">
                  {doc.area}
                </span>
              )}
              {doc.updatedAt && (
                <span className="px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-2xs font-medium">
                  {doc.updatedAt}
                </span>
              )}
            </div>
          </div>

          <div className="absolute bottom-5 right-5 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Settings2 size={16} className="text-white/60" />
          </div>
        </div>

        {/* Metrics column — right, bento style */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
          <MetricCard icon={Table2} value={tables.length} label="Tablas" color="text-brand-600" accent="card-brand" />
          <MetricCard icon={Columns3} value={(doc.columns || []).length} label="Columnas" color="text-blue-600" accent="card-blue" />
          <MetricCard icon={FunctionSquare} value={totalMeasures} label="Medidas DAX" color="text-violet-600" accent="card-violet" />
          <MetricCard icon={Link2} value={activeRels} label="Relaciones" color="text-amber-600" accent="card-amber" />
        </div>
      </div>

      {/* Details + Source row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card card-brand">
          <div className="p-5 space-y-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <ClipboardList size={18} />
              </div>
              <h3 className="text-sm font-bold text-ink-900">Detalles</h3>
            </div>
            <DetailRow icon={Layers} label="Area" value={doc.area || '—'} accent="text-brand-500" />
            <DetailRow icon={Layers} label="Direccion" value={doc.direccion || '—'} accent="text-brand-500" />
            <DetailRow icon={User} label="Responsable" value={doc.responsable || '—'} accent="text-blue-500" />
            <DetailRow icon={Layers} label="Compatibilidad" value={`PBI ${doc.compat || '—'}`} accent="text-violet-500" />
            <DetailRow icon={Calendar} label="Creado" value={doc.createdAt || '—'} accent="text-amber-500" />
            <DetailRow icon={Calendar} label="Actualizado" value={doc.updatedAt || '—'} accent="text-amber-500" />
          </div>
        </div>

        {doc.source && (
          <div className="card card-amber">
            <div className="p-5 space-y-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Database size={18} />
                </div>
                <h3 className="text-sm font-bold text-ink-900">Fuente</h3>
              </div>
              <DetailRow icon={Plug} label="Conector" value={doc.source.connector || '—'} accent="text-amber-500" />
              <DetailRow icon={Wifi} label="Modo" value={doc.source.mode || '—'} accent="text-blue-500" />
              {doc.source.url && <DetailRow icon={Globe} label="URL" value={doc.source.url} accent="text-violet-500" />}
              {doc.source.fileType && <DetailRow icon={FileType} label="Archivos" value={doc.source.fileType} accent="text-brand-500" />}
            </div>
          </div>
        )}
      </div>

      {/* Tables — full width */}
      <div className="card card-blue overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Table2 size={18} />
            </div>
            <h3 className="text-sm font-bold text-ink-900">Tablas del Modelo</h3>
          </div>
          <span className="text-2xs text-ink-400 font-mono bg-surface-50 px-2.5 py-1 rounded-full">{tables.length} tablas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                {['Tabla', 'Tipo', 'Cols', 'Filas', 'Descripcion'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.map((t, i) => (
                <tr key={i} className="border-b border-surface-100/60 last:border-0 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 transition-colors">
                  <td className="px-5 py-3 text-[13px] font-semibold text-ink-900 whitespace-nowrap">{t.name}</td>
                  <td className="px-5 py-3"><TypeBadge type={t.type} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">{t.cols}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-400 whitespace-nowrap">{t.rows}</td>
                  <td className="px-5 py-3 text-xs text-ink-500 leading-relaxed">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, value, label, color, accent }: {
  icon: React.ElementType; value: number; label: string; color: string; accent: string
}) {
  return (
    <div className={`card ${accent}`}>
      <div className="p-4 flex flex-col justify-between h-full">
        <div className={`w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center ${color} mb-3`}>
          <Icon size={17} />
        </div>
        <div>
          <div className={`text-2xl font-extrabold ${color} font-mono leading-none`}>{value}</div>
          <div className="text-2xs text-ink-400 uppercase tracking-wider font-semibold mt-1">{label}</div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value, accent }: { icon?: React.ElementType; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-100/60 last:border-0 group">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon size={14} className={`${accent || 'text-ink-300'} opacity-60 group-hover:opacity-100 transition-opacity`} />
        )}
        <span className="text-xs text-ink-400">{label}</span>
      </div>
      <span className="text-xs text-ink-700 font-medium">{value}</span>
    </div>
  )
}
