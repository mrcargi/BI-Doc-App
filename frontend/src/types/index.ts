// ── Sub-models ──
export interface Tabla {
  name: string
  type: 'import' | 'calc' | 'empty' | 'param'
  cols: number
  rows: string
  desc: string
}

export interface Relacion {
  fromTable: string
  fromCol: string
  toTable: string
  toCol: string
  card: string
  dir: string
  active: boolean
}

export interface Columna {
  n: string
  t: string
  d: string
}

export interface Medida {
  n: string
  d: string
}

export interface Carpeta {
  name: string
  color: string
  measures: Medida[]
}

export interface Fuente {
  connector: string
  url: string
  folder: string
  fileType: string
  mode: string
  api: string
  user: string
  steps: string[]
}

// ── Main models ──
export interface Reporte {
  id: string
  name: string
  area: string
  direccion: string
  desc: string
  responsable: string
  estado: 'activo' | 'desarrollo' | 'deprecado'
  tags: string[]
  compat: string
  color: string
  emoji: string
  pdfFile: string | null
  createdAt: string
  updatedAt: string
  tables: Tabla[]
  relations: Relacion[]
  columns: Columna[]
  folders: Carpeta[]
  source: Fuente | null
}

export interface Area {
  id: string
  nombre: string
  subAreas: string[]
  color: string
  responsable: string
  descripcion: string
}

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'editor'
}

export interface UserListItem extends User {
  is_active: boolean
  created_at: string
  last_login: string | null
}

// ── API responses ──
export interface ReporteList {
  total: number
  items: Reporte[]
}

export interface AreaList {
  total: number
  items: Area[]
}

export interface SearchResult {
  total: number
  query: string | null
  items: Reporte[]
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    id: string
    name: string
    tables: number
    columns: number
    measures: number
    relations: number
  }
}

export interface MessageResponse {
  ok: boolean
  message: string
  id?: string
}
