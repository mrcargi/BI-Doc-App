from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date


# ── Auth models ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordChange(BaseModel):
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "editor"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ── Sub-models ───────────────────────────────────────────────────────────────

class Tabla(BaseModel):
    name: str
    type: str                          # import | calc | empty | param
    cols: int = 0
    rows: str = "—"
    desc: str = ""

class Relacion(BaseModel):
    fromTable: str
    fromCol: str
    toTable: str
    toCol: str
    card: str = "*:1"
    dir: str = "OneDirection"
    active: bool = True

class Columna(BaseModel):
    n: str                             # nombre
    t: str                             # tipo
    d: str = ""                        # descripción

class Medida(BaseModel):
    n: str
    d: str = ""

class Carpeta(BaseModel):
    name: str
    color: str = "#5C9868"
    measures: List[Medida] = []

class Fuente(BaseModel):
    connector: str = ""
    url: str = ""
    folder: str = ""
    fileType: str = ""
    mode: str = "Import"
    api: str = ""
    user: str = ""
    steps: List[str] = []


# ── Main Reporte model ────────────────────────────────────────────────────────

class Reporte(BaseModel):
    id: str
    name: str
    area: str = ""
    direccion: str = ""                # Dir. Ventas, Dir. Operaciones, etc.
    desc: str = ""
    responsable: str = ""
    estado: str = "activo"            # activo | desarrollo | deprecado
    tags: List[str] = []
    compat: str = ""
    color: str = "#5C9868"
    emoji: str = "📊"
    pdfFile: Optional[str] = None     # filename inside /pdfs/
    createdAt: str = ""
    updatedAt: str = ""
    tables: List[Tabla] = []
    relations: List[Relacion] = []
    columns: List[Columna] = []
    folders: List[Carpeta] = []
    source: Optional[Fuente] = None

class ReporteCreate(BaseModel):
    name: str
    area: str = ""
    direccion: str = ""
    desc: str = ""
    responsable: str = ""
    estado: str = "activo"
    tags: List[str] = []
    compat: str = "1550"
    color: str = "#5C9868"
    emoji: str = "📊"

class ReporteUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    direccion: Optional[str] = None
    desc: Optional[str] = None
    responsable: Optional[str] = None
    estado: Optional[str] = None
    tags: Optional[List[str]] = None
    compat: Optional[str] = None
    color: Optional[str] = None
    emoji: Optional[str] = None
    tables: Optional[List[Tabla]] = None
    relations: Optional[List[Relacion]] = None
    columns: Optional[List[Columna]] = None
    folders: Optional[List[Carpeta]] = None
    source: Optional[Fuente] = None


# ── Area model ────────────────────────────────────────────────────────────────

class Area(BaseModel):
    id: str
    nombre: str
    subAreas: List[str] = []
    color: str = "#5C9868"
    responsable: str = ""
    descripcion: str = ""

class AreaCreate(BaseModel):
    nombre: str
    subAreas: List[str] = []
    color: str = "#5C9868"
    responsable: str = ""
    descripcion: str = ""

class AreaUpdate(BaseModel):
    nombre: Optional[str] = None
    subAreas: Optional[List[str]] = None
    color: Optional[str] = None
    responsable: Optional[str] = None
    descripcion: Optional[str] = None


# ── Response wrappers ─────────────────────────────────────────────────────────

class ReporteList(BaseModel):
    total: int
    items: List[Reporte]

class AreaList(BaseModel):
    total: int
    items: List[Area]

class SearchResult(BaseModel):
    total: int
    query: Optional[str] = None
    direccion: Optional[str] = None
    area: Optional[str] = None
    estado: Optional[str] = None
    items: List[Reporte]

class MessageResponse(BaseModel):
    ok: bool
    message: str
    id: Optional[str] = None
