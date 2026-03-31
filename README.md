# PBI Docs — Plataforma de Documentacion de Reportes

Sistema interno de gestion y documentacion de modelos semanticos Power BI. Permite centralizar, organizar y consultar la metadata de todos los reportes de la organizacion desde una interfaz administrativa segura.

---

## 📚 Documentacion

| Documento | Proposito |
|-----------|-----------|
| [QUICK_START.md](QUICK_START.md) | Guia rapida de setup (Windows, Mac, Linux) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura tecnica detallada |
| [SECURITY.md](SECURITY.md) | Configuracion y mejores practicas de seguridad |
| [docs/TEAM_GUIDE.md](docs/TEAM_GUIDE.md) | Guia para documentar reportes Power BI |

---

## Requisitos Previos

- Python 3.10 o superior
- Node.js 18 o superior
- Windows 10/11

---

## Instalacion y Puesta en Marcha

### Backend

```bash
# Crear entorno virtual e instalar dependencias
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Iniciar servidor (puerto 8000)
python -m uvicorn main:app --reload --port 8000
```

### Frontend (modo desarrollo)

```bash
cd frontend
npm install
npm run dev
```

El frontend se ejecuta en `http://localhost:5173` y se conecta al backend via proxy.

### Inicio Rapido (Windows)

Ejecutar `start.bat` para iniciar backend y frontend simultaneamente.

---

## Funcionalidades Principales

### Gestion de Reportes
- Registro manual de reportes con datos basicos (nombre, area, direccion, responsable)
- Importacion de documentacion completa via JSON (tablas, columnas, medidas, relaciones, fuente de datos)
- Edicion y eliminacion de reportes existentes
- Busqueda y filtrado por area, direccion, estado y tags

### Documentacion del Modelo Semantico
- Inventario de tablas con tipo, cantidad de columnas y filas
- Catalogo de columnas con tipo de dato y descripcion
- Medidas DAX organizadas por carpeta
- Relaciones entre tablas (cardinalidad, direccion, estado)
- Fuente de datos: conector, endpoint, modo de carga, pasos de transformacion

### Exportacion PDF
- Generacion de resumen ejecutivo en formato PDF
- Portada con branding institucional
- Seccion de metricas, tablas, medidas y fuente de datos
- Listo para presentacion a directivos

### Sistema de Usuarios
- Autenticacion mediante JWT
- Roles: **admin** (gestion completa) y **editor** (gestion limitada a sus reportes)
- Administracion de usuarios: crear, editar, cambiar contrasena, activar/desactivar, eliminar

### Notificaciones
- Notificaciones en tiempo real al crear o actualizar reportes
- Panel de notificaciones con filtros por tipo, fecha y estado de lectura
- Registro de quien realizo cada accion

---

## Endpoints de la API

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/login` | Inicio de sesion |
| GET | `/api/auth/me` | Perfil del usuario autenticado |
| PUT | `/api/auth/password` | Cambio de contrasena propia |

### Reportes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/reportes` | Listar todos los reportes |
| GET | `/api/reportes/{id}` | Consultar un reporte |
| POST | `/api/reportes` | Crear reporte (manual) |
| POST | `/api/upload-json` | Crear o actualizar reporte via JSON |
| PUT | `/api/reportes/{id}` | Actualizar reporte |
| DELETE | `/api/reportes/{id}` | Eliminar reporte (admin) |

### PDF

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/reportes/{id}/pdf` | Adjuntar PDF |
| DELETE | `/api/reportes/{id}/pdf` | Eliminar PDF adjunto |
| GET | `/api/reportes/{id}/export-pdf` | Exportar resumen ejecutivo |

### Usuarios (admin)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/{id}` | Actualizar usuario |
| PUT | `/api/users/{id}/password` | Resetear contrasena |
| DELETE | `/api/users/{id}` | Eliminar usuario |

### Notificaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/notifications` | Obtener notificaciones del usuario |
| PUT | `/api/notifications/read-all` | Marcar todas como leidas |
| PUT | `/api/notifications/{id}/read` | Marcar una como leida |

### Otros

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/buscar` | Busqueda con filtros |
| GET | `/api/stats` | Estadisticas generales |
| GET | `/api/areas` | Listar areas |
| GET | `/api/audit-log` | Registro de auditoria (admin) |
| GET | `/docs` | Documentacion interactiva de la API (Swagger) |

---

## Seguridad

- Todas las rutas de la API requieren autenticacion via token JWT (excepto login)
- Las contrasenas se almacenan con hash PBKDF2-SHA256 con salt aleatorio
- Los tokens tienen vigencia de 12 horas
- Las acciones administrativas requieren rol de administrador
- Se mantiene un registro de auditoria de todas las operaciones

---

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Backend | FastAPI, Python 3.10+ |
| Base de datos | SQLite (WAL mode) |
| Autenticacion | JWT (PyJWT) |
| Frontend | React 19, TypeScript, Vite 6 |
| Estilos | Tailwind CSS 3 |
| Animaciones | GSAP 3 |
| PDF | ReportLab, pypdf |

---

*Sistema desarrollado para uso interno. Acceso restringido a personal autorizado.*
