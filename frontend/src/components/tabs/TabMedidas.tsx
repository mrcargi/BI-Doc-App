import { useState } from 'react'
import { FunctionSquare, ChevronRight } from 'lucide-react'
import type { Reporte } from '@/types'

export function TabMedidas({ doc }: { doc: Reporte }) {
  const folders = doc.folders || []
  const total = folders.reduce((s, f) => s + (f.measures || []).length, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FunctionSquare size={16} className="text-violet-600" />
        <span className="text-sm font-bold text-ink-900">Medidas DAX</span>
        <span className="text-2xs text-ink-400 font-mono ml-auto">{total} medidas en {folders.length} carpetas</span>
      </div>
      {folders.map((f, i) => (
        <Folder key={i} name={f.name} color={f.color} measures={f.measures || []} />
      ))}
    </div>
  )
}

function Folder({ name, color, measures }: { name: string; color: string; measures: { n: string; d: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div
        onClick={() => setOpen(!open)}
        className="px-5 py-3.5 flex items-center gap-3 cursor-pointer transition-colors hover:bg-surface-50 border-l-[3px]"
        style={{ borderLeftColor: color }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[13px] font-semibold text-ink-900">{name}</span>
        <span className="font-mono text-2xs text-ink-400 ml-auto">{measures.length} medidas</span>
        <ChevronRight size={14} className={`text-ink-300 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </div>
      {open && (
        <div className="border-t border-surface-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="px-5 py-3 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Medida</th>
                  <th className="px-5 py-3 text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider">Descripcion</th>
                </tr>
              </thead>
              <tbody>
                {measures.map((m, i) => (
                  <tr key={i} className="border-b border-surface-100/60 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 text-[13px] font-semibold text-ink-900">{m.n}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">{m.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
