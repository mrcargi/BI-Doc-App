import { useState } from 'react'
import { Columns3 } from 'lucide-react'
import type { Reporte } from '@/types'
import { ColBadge } from '@/components/ui/Badge'

const FILTERS = ['', 'Texto', 'Entero', 'Decimal', 'Fecha/Hora', 'Calculada']

export function TabColumnas({ doc }: { doc: Reporte }) {
  const [filter, setFilter] = useState('')
  const cols = (doc.columns || []).filter(c => !filter || c.t === filter)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-ink-400 font-medium">Tipo:</span>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-2xs font-semibold border cursor-pointer transition-all ${
              filter === f
                ? 'bg-ink-900 border-ink-900 text-white shadow-soft'
                : 'border-surface-200 bg-surface-0 text-ink-400 hover:border-brand-400 hover:text-brand-600'
            }`}
          >
            {f || 'Todos'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden border-t-2 border-t-blue-500">
        <div className="card-header flex items-center gap-2">
          <Columns3 size={15} className="text-blue-600" />
          <h3 className="text-sm font-bold text-ink-900">Columnas</h3>
          <span className="ml-auto text-2xs text-ink-400 font-mono">{cols.length} columnas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                {['#', 'Columna', 'Tipo', 'Descripcion'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cols.map((c, i) => (
                <tr key={i} className="border-b border-surface-100/60 last:border-0 hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-ink-300">{i + 1}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-ink-900">{c.n}</td>
                  <td className="px-5 py-3"><ColBadge type={c.t} /></td>
                  <td className="px-5 py-3 text-xs text-ink-500">{c.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
