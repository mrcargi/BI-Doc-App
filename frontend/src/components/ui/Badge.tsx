const typeStyles: Record<string, string> = {
  import: 'bg-brand-50 text-brand-800',
  calc: 'bg-blue-50 text-blue-700',
  empty: 'bg-violet-50 text-violet-700',
  param: 'bg-amber-50 text-amber-700',
}

const colStyles: Record<string, string> = {
  Texto: 'bg-brand-50 text-brand-800',
  Entero: 'bg-blue-50 text-blue-700',
  Decimal: 'bg-red-50 text-red-700',
  'Fecha/Hora': 'bg-amber-50 text-amber-700',
  Calculada: 'bg-violet-50 text-violet-700',
}

const typeLabels: Record<string, string> = {
  import: 'Import',
  calc: 'Calculada',
  empty: 'Vacia',
  param: 'Parametro',
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-2xs font-semibold font-mono ${typeStyles[type] || 'bg-surface-100 text-ink-500'}`}>
      {typeLabels[type] || type}
    </span>
  )
}

export function ColBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-2xs font-semibold font-mono ${colStyles[type] || 'bg-surface-100 text-ink-500'}`}>
      {type}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    activo: 'bg-brand-50 text-brand-800',
    desarrollo: 'bg-amber-50 text-amber-700',
    deprecado: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-2xs font-semibold ${styles[estado] || 'bg-surface-100 text-ink-500'}`}>
      {estado}
    </span>
  )
}
