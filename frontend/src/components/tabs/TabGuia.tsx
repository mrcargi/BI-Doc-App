import { useState } from 'react'
import { BookOpen, Upload, FileJson, ClipboardCopy, Check, ChevronDown, ChevronRight, Cpu, FileText, Users, Bell, Layers, Info } from 'lucide-react'

const PROMPT_TEMPLATE = `Necesito que documentes el siguiente reporte de Power BI en formato JSON para subirlo a nuestra plataforma PBI Docs.

Analiza el modelo semantico completo y devuelveme un JSON con EXACTAMENTE esta estructura:

{
  "name": "Nombre del reporte",
  "area": "Area del negocio (ej: Ventas Institucionales, Canal Nlinea)",
  "direccion": "Direccion organizacional (ej: Dir. Ventas, Dir. Operaciones)",
  "desc": "Descripcion detallada del proposito del reporte, que monitorea, que permite analizar",
  "responsable": "Nombre del responsable o equipo",
  "estado": "activo",
  "tags": ["tag1", "tag2", "tag3"],
  "compat": "1550",
  "emoji": "📊",
  "tables": [
    {
      "name": "NombreTabla",
      "type": "import | calc | empty | param",
      "cols": 10,
      "rows": "miles | millones | dinamica | — | 5 filas",
      "desc": "Descripcion de la tabla y su proposito en el modelo"
    }
  ],
  "relations": [
    {
      "fromTable": "TablaOrigen",
      "fromCol": "ColumnaOrigen",
      "toTable": "TablaDestino",
      "toCol": "ColumnaDestino",
      "card": "*:1",
      "dir": "OneDirection | BothDirections",
      "active": true
    }
  ],
  "columns": [
    {
      "n": "NombreColumna",
      "t": "Texto | Entero | Decimal | Fecha | Boolean",
      "d": "Descripcion de la columna y que representa"
    }
  ],
  "folders": [
    {
      "name": "NombreCarpeta",
      "color": "#5C9868",
      "measures": [
        {
          "n": "NombreMedida",
          "d": "Descripcion de la medida DAX y su formula"
        }
      ]
    }
  ],
  "source": {
    "connector": "Tipo de conector (ej: SharePoint.Files, Azure Databricks)",
    "url": "URL de conexion",
    "folder": "Ruta o carpeta de los datos",
    "fileType": "Formato (CSV, Delta Table, Excel)",
    "mode": "Import | DirectQuery",
    "api": "Version de API o catalogo",
    "user": "Cuenta de servicio o metodo de autenticacion",
    "steps": [
      "Paso 1 de transformacion en Power Query",
      "Paso 2 de transformacion...",
      "Paso N..."
    ]
  }
}

INSTRUCCIONES IMPORTANTES:
- Incluye TODAS las tablas del modelo, no solo las principales
- Para cada tabla, indica el tipo correcto: "import" (datos externos), "calc" (calculada con DAX), "empty" (contenedor de medidas), "param" (parametro)
- Documenta TODAS las columnas con su tipo de dato correcto
- Agrupa las medidas DAX por su carpeta de display
- En "source.steps", describe cada paso de transformacion de Power Query en lenguaje natural
- La descripcion de cada medida debe incluir que calcula y su logica
- Devuelve SOLO el JSON, sin texto adicional`

export function TabGuia() {
  const [copied, setCopied] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quickstart: true,
    prompt: false,
    json: false,
    roles: false,
  })

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* fallback */ }
  }

  return (
    <div className="space-y-5 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
          <BookOpen size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900">Guia de Uso</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            Instrucciones para documentar y gestionar reportes en la plataforma
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <CollapsibleSection
        id="quickstart"
        icon={Layers}
        title="Inicio Rapido"
        subtitle="Pasos basicos para comenzar a usar la plataforma"
        color="brand"
        open={openSections.quickstart}
        onToggle={() => toggleSection('quickstart')}
      >
        <div className="space-y-4">
          <Step number={1} title="Crear o importar un reporte">
            <p>Utiliza el boton <strong>"Nuevo Reporte"</strong> en la barra lateral. Tienes dos opciones:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Crear manual:</strong> Registra un reporte con datos basicos (nombre, area, direccion). Podras completar la documentacion despues.</li>
              <li><strong>Subir JSON:</strong> Importa la documentacion completa generada con el prompt de esta guia. Este metodo es el recomendado.</li>
            </ul>
          </Step>

          <Step number={2} title="Generar la documentacion con IA">
            <p>Conecta tu modelo de Power BI con Claude u otro asistente de IA que tenga acceso al modelo semantico. Usa el <strong>prompt proporcionado en la seccion siguiente</strong> para generar un JSON con toda la metadata.</p>
          </Step>

          <Step number={3} title="Subir el JSON">
            <p>Haz clic en <strong>"Nuevo Reporte" &gt; "Subir JSON"</strong>, pega o arrastra el archivo JSON generado. El sistema validara la estructura automaticamente antes de guardar.</p>
          </Step>

          <Step number={4} title="Revisar y complementar">
            <p>Una vez importado, revisa cada pestana del reporte:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Resumen:</strong> Vision general, metricas clave, detalles y fuente</li>
              <li><strong>Modelo:</strong> Relaciones entre tablas</li>
              <li><strong>Columnas:</strong> Catalogo completo de campos</li>
              <li><strong>Medidas DAX:</strong> Indicadores agrupados por carpeta</li>
              <li><strong>Fuente:</strong> Arquitectura de datos, origen y transformaciones</li>
            </ul>
          </Step>

          <Step number={5} title="Exportar PDF ejecutivo">
            <p>Desde cualquier reporte, presiona <strong>"Exportar PDF"</strong> para generar un resumen ejecutivo listo para presentar a directivos.</p>
          </Step>
        </div>
      </CollapsibleSection>

      {/* Prompt Section */}
      <CollapsibleSection
        id="prompt"
        icon={Cpu}
        title="Prompt para Documentar Reportes"
        subtitle="Copia este prompt y usalo con Claude conectado a tu modelo de Power BI"
        color="violet"
        open={openSections.prompt}
        onToggle={() => toggleSection('prompt')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-500">
              Este prompt esta disenado para extraer la documentacion completa de un modelo semantico de Power BI.
              Requiere que el asistente de IA tenga acceso al modelo via MCP u otra conexion directa.
            </p>
          </div>

          {/* Prompt block */}
          <div className="relative group">
            <div className="bg-[#1a1a2e] rounded-xl p-5 overflow-auto max-h-[500px] custom-scrollbar">
              <pre className="text-[12px] leading-relaxed text-emerald-300 font-mono whitespace-pre-wrap">{PROMPT_TEMPLATE}</pre>
            </div>
            <button
              onClick={copyPrompt}
              className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-sm'
              }`}
            >
              {copied ? <><Check size={13} /> Copiado</> : <><ClipboardCopy size={13} /> Copiar</>}
            </button>
          </div>

          {/* Usage tips */}
          <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-violet-600" />
              <span className="text-xs font-bold text-violet-800">Recomendaciones</span>
            </div>
            <ul className="text-xs text-violet-700 space-y-1.5">
              <li>Verifica que el asistente tenga acceso completo al modelo semantico antes de ejecutar el prompt</li>
              <li>Revisa que todas las tablas, columnas y medidas esten incluidas en la respuesta</li>
              <li>Si el modelo es muy grande, solicita la documentacion por secciones y consolida despues</li>
              <li>El JSON generado puede editarse manualmente antes de subirlo si es necesario</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* JSON Structure */}
      <CollapsibleSection
        id="json"
        icon={FileJson}
        title="Estructura del JSON"
        subtitle="Referencia de los campos requeridos y opcionales"
        color="blue"
        open={openSections.json}
        onToggle={() => toggleSection('json')}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-2.5 px-3 text-ink-400 font-semibold uppercase tracking-wider text-2xs">Campo</th>
                <th className="text-left py-2.5 px-3 text-ink-400 font-semibold uppercase tracking-wider text-2xs">Tipo</th>
                <th className="text-left py-2.5 px-3 text-ink-400 font-semibold uppercase tracking-wider text-2xs">Requerido</th>
                <th className="text-left py-2.5 px-3 text-ink-400 font-semibold uppercase tracking-wider text-2xs">Descripcion</th>
              </tr>
            </thead>
            <tbody>
              <FieldRow field="name" type="string" required desc="Nombre del reporte" />
              <FieldRow field="area" type="string" required desc="Area del negocio" />
              <FieldRow field="direccion" type="string" required desc="Direccion organizacional" />
              <FieldRow field="desc" type="string" desc="Descripcion detallada del reporte" />
              <FieldRow field="responsable" type="string" desc="Nombre del responsable" />
              <FieldRow field="estado" type="string" desc="activo | desarrollo | deprecado" />
              <FieldRow field="tags" type="string[]" desc="Etiquetas para busqueda" />
              <FieldRow field="tables" type="Tabla[]" required desc="Listado de tablas del modelo" />
              <FieldRow field="columns" type="Columna[]" required desc="Catalogo de columnas" />
              <FieldRow field="folders" type="Carpeta[]" required desc="Medidas DAX agrupadas por carpeta" />
              <FieldRow field="relations" type="Relacion[]" desc="Relaciones entre tablas" />
              <FieldRow field="source" type="Fuente" desc="Origen de datos y transformaciones" />
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-800">Campos obligatorios</span>
          </div>
          <p className="text-xs text-amber-700">
            Los campos <code className="bg-amber-100 px-1 rounded text-amber-800">name</code>, <code className="bg-amber-100 px-1 rounded text-amber-800">area</code>, <code className="bg-amber-100 px-1 rounded text-amber-800">direccion</code>, <code className="bg-amber-100 px-1 rounded text-amber-800">tables</code>, <code className="bg-amber-100 px-1 rounded text-amber-800">columns</code> y <code className="bg-amber-100 px-1 rounded text-amber-800">folders</code> son
            obligatorios. El sistema rechazara el JSON si alguno falta.
          </p>
        </div>
      </CollapsibleSection>

      {/* Roles */}
      <CollapsibleSection
        id="roles"
        icon={Users}
        title="Roles y Permisos"
        subtitle="Capacidades de cada tipo de usuario en la plataforma"
        color="amber"
        open={openSections.roles}
        onToggle={() => toggleSection('roles')}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RoleCard
            role="Administrador"
            color="brand"
            permissions={[
              'Crear, editar y eliminar reportes',
              'Importar documentacion via JSON',
              'Exportar resumenes ejecutivos PDF',
              'Gestionar usuarios (crear, editar, eliminar)',
              'Resetear contrasenas de otros usuarios',
              'Activar y desactivar cuentas',
              'Recibir notificaciones de todas las acciones',
              'Acceso al registro de auditoria',
            ]}
          />
          <RoleCard
            role="Editor"
            color="blue"
            permissions={[
              'Crear y editar reportes propios',
              'Importar documentacion via JSON',
              'Exportar resumenes ejecutivos PDF',
              'Cambiar su propia contrasena',
              'Recibir notificaciones de sus acciones',
              'Consultar todos los reportes',
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div className="text-center py-4 border-t border-surface-100">
        <p className="text-2xs text-ink-300">
          Para soporte tecnico o dudas adicionales, contacta al administrador de la plataforma.
        </p>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function CollapsibleSection({ id, icon: Icon, title, subtitle, color, open, onToggle, children }: {
  id: string; icon: React.ElementType; title: string; subtitle: string; color: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    brand: { border: 'border-t-brand-500', bg: 'bg-brand-50', text: 'text-brand-600' },
    violet: { border: 'border-t-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
    blue: { border: 'border-t-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { border: 'border-t-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <div className={`card overflow-hidden border-t-2 ${c.border}`}>
      <button
        onClick={onToggle}
        className="w-full card-header flex items-center gap-3 cursor-pointer hover:bg-surface-50/50 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon size={17} className={c.text} />
        </div>
        <div className="text-left flex-1 min-w-0">
          <h3 className="text-sm font-bold text-ink-900">{title}</h3>
          <p className="text-2xs text-ink-400">{subtitle}</p>
        </div>
        <div className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} className="text-ink-400" />
        </div>
      </button>
      {open && (
        <div className="card-body border-t border-surface-100/60">
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-ink-900 mb-1">{title}</h4>
        <div className="text-xs text-ink-500 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function FieldRow({ field, type, required, desc }: { field: string; type: string; required?: boolean; desc: string }) {
  return (
    <tr className="border-b border-surface-100/60 last:border-0 hover:bg-surface-50/50 transition-colors">
      <td className="py-2.5 px-3 font-mono text-ink-900 font-semibold">{field}</td>
      <td className="py-2.5 px-3 font-mono text-violet-600">{type}</td>
      <td className="py-2.5 px-3">
        {required && <span className="text-2xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Si</span>}
      </td>
      <td className="py-2.5 px-3 text-ink-500">{desc}</td>
    </tr>
  )
}

function RoleCard({ role, color, permissions }: { role: string; color: string; permissions: string[] }) {
  const colorMap: Record<string, { bg: string; text: string; badge: string; check: string }> = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-700', badge: 'bg-brand-100 text-brand-700', check: 'text-brand-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', check: 'text-blue-500' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <div className={`rounded-xl border border-surface-200 p-4 ${c.bg}/30`}>
      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${c.badge} mb-3`}>{role}</span>
      <ul className="space-y-2">
        {permissions.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ink-600">
            <Check size={13} className={`${c.check} shrink-0 mt-0.5`} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
