import { Database, Workflow, Server, Globe, FolderOpen, FileType, Zap, Shield, Layers, Table2, ArrowRight, Link2, HardDrive, Cable } from 'lucide-react'
import type { Reporte } from '@/types'

export function TabFuente({ doc }: { doc: Reporte }) {
  const s = doc.source
  if (!s) {
    return (
      <div className="card card-body">
        <p className="text-sm text-ink-400">Sin informacion de fuente registrada.</p>
      </div>
    )
  }

  // Derive connector type for icon/color
  const connType = getConnectorType(s.connector)
  const importTables = (doc.tables || []).filter(t => t.type === 'import')
  const calcTables = (doc.tables || []).filter(t => t.type === 'calc' || t.type === 'empty' || t.type === 'param')
  const totalCols = (doc.columns || []).length
  const activeRels = (doc.relations || []).filter(r => r.active).length

  return (
    <div className="space-y-5">
      {/* Architecture overview */}
      <div className="card overflow-hidden border-t-2 border-t-brand-500">
        <div className="card-header flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
            <Cable size={16} className="text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900">Arquitectura de Datos</h3>
            <p className="text-2xs text-ink-400">Flujo de datos desde el origen hasta Power BI</p>
          </div>
        </div>
        <div className="card-body">
          {/* Data flow visual */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-surface-50 to-surface-0 rounded-xl border border-surface-100 overflow-x-auto">
            {/* Source */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connType.bg}`}>
                <connType.icon size={22} className={connType.text} />
              </div>
              <span className="text-2xs font-bold text-ink-700 text-center max-w-[80px] leading-tight">{connType.label}</span>
            </div>

            <ArrowRight size={18} className="text-ink-300 shrink-0" />

            {/* Mode */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Zap size={22} className="text-blue-600" />
              </div>
              <span className="text-2xs font-bold text-ink-700">{s.mode || 'Import'}</span>
            </div>

            <ArrowRight size={18} className="text-ink-300 shrink-0" />

            {/* Transformations */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <Workflow size={22} className="text-violet-600" />
              </div>
              <span className="text-2xs font-bold text-ink-700">{s.steps?.length || 0} pasos</span>
            </div>

            <ArrowRight size={18} className="text-ink-300 shrink-0" />

            {/* Model */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Layers size={22} className="text-amber-600" />
              </div>
              <span className="text-2xs font-bold text-ink-700">Modelo PBI</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <MiniStat icon={Table2} label="Tablas importadas" value={importTables.length} color="text-brand-600" bg="bg-brand-50" />
            <MiniStat icon={Table2} label="Tablas calculadas" value={calcTables.length} color="text-violet-600" bg="bg-violet-50" />
            <MiniStat icon={Layers} label="Columnas" value={totalCols} color="text-blue-600" bg="bg-blue-50" />
            <MiniStat icon={Link2} label="Relaciones" value={activeRels} color="text-amber-600" bg="bg-amber-50" />
          </div>
        </div>
      </div>

      {/* Connector details */}
      <div className="card overflow-hidden border-t-2 border-t-amber-500">
        <div className="card-header flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Server size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900">Origen de Datos</h3>
            <p className="text-2xs text-ink-400">Detalles de conexion al origen</p>
          </div>
        </div>
        <div className="card-body space-y-0">
          <SourceRow icon={Database} label="Conector" value={s.connector} accent="text-amber-500" highlight />
          {s.url && <SourceRow icon={Globe} label="URL / Endpoint" value={s.url} accent="text-blue-500" isLink />}
          {s.folder && <SourceRow icon={FolderOpen} label="Ruta / Warehouse" value={s.folder} accent="text-violet-500" isLink />}
          {s.fileType && <SourceRow icon={FileType} label="Formato de datos" value={s.fileType} accent="text-brand-500" />}
          <SourceRow icon={Zap} label="Modo de carga" value={s.mode || 'Import'} accent="text-blue-500" badge={s.mode === 'Import' ? 'Snapshot' : 'Live'} />
          {s.api && <SourceRow icon={HardDrive} label="API / Catalogo" value={s.api} accent="text-ink-400" />}
          {s.user && <SourceRow icon={Shield} label="Autenticacion" value={s.user} accent="text-brand-500" />}
        </div>
      </div>

      {/* Tables from source */}
      {importTables.length > 0 && (
        <div className="card overflow-hidden border-t-2 border-t-blue-500">
          <div className="card-header flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Table2 size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900">Tablas del Origen</h3>
              <p className="text-2xs text-ink-400">Tablas cargadas directamente desde la fuente de datos</p>
            </div>
            <span className="ml-auto text-2xs font-mono text-ink-400 bg-surface-50 px-2.5 py-1 rounded-full">{importTables.length} tablas</span>
          </div>
          <div className="card-body p-0">
            {importTables.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-surface-100/60 last:border-0 hover:bg-surface-50/50 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Table2 size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-ink-900">{t.name}</div>
                  {t.desc && <div className="text-2xs text-ink-400 truncate">{t.desc}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-2xs font-mono text-ink-400">{t.cols} cols</span>
                  <span className="text-2xs font-mono text-ink-400">{t.rows} filas</span>
                  <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{t.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculated tables */}
      {calcTables.length > 0 && (
        <div className="card overflow-hidden border-t-2 border-t-violet-500">
          <div className="card-header flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Layers size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900">Tablas Generadas en el Modelo</h3>
              <p className="text-2xs text-ink-400">Tablas calculadas, parametros y contenedores de medidas</p>
            </div>
            <span className="ml-auto text-2xs font-mono text-ink-400 bg-surface-50 px-2.5 py-1 rounded-full">{calcTables.length} tablas</span>
          </div>
          <div className="card-body p-0">
            {calcTables.map((t, i) => {
              const typeInfo = getTableTypeInfo(t.type)
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-surface-100/60 last:border-0 hover:bg-surface-50/50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${typeInfo.bg} ${typeInfo.bgHover}`}>
                    <typeInfo.icon size={14} className={typeInfo.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink-900">{t.name}</div>
                    {t.desc && <div className="text-2xs text-ink-400 truncate">{t.desc}</div>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {t.cols > 0 && <span className="text-2xs font-mono text-ink-400">{t.cols} cols</span>}
                    {t.rows !== '—' && <span className="text-2xs font-mono text-ink-400">{t.rows}</span>}
                    <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${typeInfo.badge}`}>{typeInfo.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Transformation steps */}
      {s.steps && s.steps.length > 0 && (
        <div className="card overflow-hidden border-t-2 border-t-violet-500">
          <div className="card-header flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Workflow size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-900">Proceso de Transformacion</h3>
              <p className="text-2xs text-ink-400">Pasos de Power Query aplicados a los datos</p>
            </div>
            <span className="ml-auto text-2xs text-ink-400 font-mono bg-surface-50 px-2.5 py-1 rounded-full">{s.steps.length} pasos</span>
          </div>
          <div className="card-body">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-violet-300 via-violet-200 to-transparent" />
              <ol className="space-y-0 relative">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 py-3 text-[13px] text-ink-700 group">
                    <span className="relative z-10 min-w-[30px] h-[30px] rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      {i + 1}
                    </span>
                    <div className="pt-1.5 flex-1">
                      <span className="group-hover:text-ink-900 transition-colors">{step}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ── */

function MiniStat({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-50/80 border border-surface-100">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={15} className={color} />
      </div>
      <div>
        <div className={`text-lg font-extrabold font-mono ${color}`}>{value}</div>
        <div className="text-2xs text-ink-400 font-medium leading-tight">{label}</div>
      </div>
    </div>
  )
}

function SourceRow({ icon: Icon, label, value, accent, isLink, highlight, badge }: {
  icon: React.ElementType; label: string; value: string; accent: string; isLink?: boolean; highlight?: boolean; badge?: string
}) {
  return (
    <div className={`flex items-start gap-3 py-3 px-1 border-b border-surface-100/60 last:border-0 group ${highlight ? 'bg-surface-50/50 -mx-1 px-2 rounded-lg' : ''}`}>
      <Icon size={15} className={`${accent} mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0`} />
      <div className="min-w-0 flex-1">
        <div className="text-2xs text-ink-400 font-medium mb-0.5">{label}</div>
        <div className={`text-[13px] font-medium break-all ${isLink ? 'text-blue-600' : 'text-ink-900'} ${highlight ? 'font-semibold' : ''}`}>
          {value || '—'}
        </div>
      </div>
      {badge && (
        <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0 mt-2">{badge}</span>
      )}
    </div>
  )
}

function getConnectorType(connector: string) {
  const c = connector.toLowerCase()
  if (c.includes('databricks') || c.includes('delta'))
    return { icon: HardDrive, label: 'Databricks', bg: 'bg-orange-50', text: 'text-orange-600' }
  if (c.includes('sharepoint'))
    return { icon: FolderOpen, label: 'SharePoint', bg: 'bg-blue-50', text: 'text-blue-600' }
  if (c.includes('sql') || c.includes('server'))
    return { icon: Database, label: 'SQL Server', bg: 'bg-red-50', text: 'text-red-600' }
  if (c.includes('excel') || c.includes('csv'))
    return { icon: FileType, label: 'Archivo', bg: 'bg-green-50', text: 'text-green-600' }
  if (c.includes('api') || c.includes('rest') || c.includes('web'))
    return { icon: Globe, label: 'API / Web', bg: 'bg-violet-50', text: 'text-violet-600' }
  return { icon: Database, label: 'Origen', bg: 'bg-surface-100', text: 'text-ink-600' }
}

function getTableTypeInfo(type: string) {
  switch (type) {
    case 'calc':
      return { icon: Workflow, label: 'Calculada', text: 'text-violet-600', bg: 'bg-violet-50', bgHover: 'group-hover:bg-violet-100', badge: 'bg-violet-50 text-violet-600' }
    case 'empty':
      return { icon: Layers, label: 'Contenedor', text: 'text-amber-600', bg: 'bg-amber-50', bgHover: 'group-hover:bg-amber-100', badge: 'bg-amber-50 text-amber-600' }
    case 'param':
      return { icon: Zap, label: 'Parametro', text: 'text-brand-600', bg: 'bg-brand-50', bgHover: 'group-hover:bg-brand-100', badge: 'bg-brand-50 text-brand-600' }
    default:
      return { icon: Table2, label: type, text: 'text-blue-600', bg: 'bg-blue-50', bgHover: 'group-hover:bg-blue-100', badge: 'bg-blue-50 text-blue-600' }
  }
}
