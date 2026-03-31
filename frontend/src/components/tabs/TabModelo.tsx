import { ArrowRight, GitBranch } from 'lucide-react'
import type { Reporte } from '@/types'
import { RelationDiagram } from '@/components/diagram/RelationDiagram'

export function TabModelo({ doc }: { doc: Reporte }) {
  const visibleRels = (doc.relations || []).filter(r => !r.toTable.includes('Local'))

  return (
    <div className="space-y-5">
      {/* Diagram */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-900">Diagrama de Relaciones</h3>
          <span className="text-2xs text-ink-400 font-mono">Arrastra nodos · Scroll para zoom</span>
        </div>
        <RelationDiagram doc={doc} />
      </div>

      {/* Relations table */}
      <div className="card card-blue overflow-hidden">
        <div className="card-header flex items-center gap-2">
          <GitBranch size={15} className="text-blue-600" />
          <h3 className="text-sm font-bold text-ink-900">Relaciones</h3>
          <span className="ml-auto text-2xs text-ink-400 font-mono">{visibleRels.length} relaciones</span>
        </div>
        <div className="card-body space-y-0">
          {visibleRels.map((r, i) => (
            <div key={i} className="flex items-center flex-wrap gap-2 py-3 border-b border-surface-100/60 last:border-0">
              <span className="bg-blue-50 border border-blue-200/60 rounded-lg px-2.5 py-1 font-mono text-[11px] text-blue-700 font-medium">
                {r.fromTable} · {r.fromCol}
              </span>
              <ArrowRight size={14} className="text-ink-300" />
              <span className="bg-blue-50 border border-blue-200/60 rounded-lg px-2.5 py-1 font-mono text-[11px] text-blue-700 font-medium">
                {r.toTable} · {r.toCol}
              </span>
              <span className="text-2xs font-mono text-ink-400 bg-surface-100 rounded-lg px-2 py-0.5">{r.card}</span>
              <span className="text-2xs font-mono text-ink-400 bg-surface-100 rounded-lg px-2 py-0.5">
                {r.dir === 'BothDirections' ? '↔ Ambas' : '→ Una'}
              </span>
              <span className={`text-2xs font-mono rounded-lg px-2 py-0.5 ${r.active ? 'text-brand-700 bg-brand-50' : 'text-ink-400 bg-surface-100'}`}>
                {r.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
