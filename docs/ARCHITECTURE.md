# 🏗️ Architecture Guide

## Project Structure

```
BI-Hub/
├── app/                      # Backend Python (FastAPI)
│   ├── auth.py              # Authentication & JWT
│   ├── database.py          # SQLite database & models
│   ├── models.py            # Data models
│   ├── pdf_export.py        # PDF generation
│   ├── routes.py            # API endpoints
│   └── storage.py           # File storage operations
│
├── frontend/                 # Frontend React (Source)
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   │   ├── modals/      # Modal dialogs
│   │   │   ├── tabs/        # Tab components
│   │   │   └── ui/          # Base UI components
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript types
│   │   ├── index.css        # Global styles (Tailwind)
│   │   └── App.tsx          # Main app component
│   ├── vite.config.ts       # Vite build config
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── tsconfig.json        # TypeScript config
│
├── static-react/             # Frontend Build Output
│   ├── index.html
│   └── assets/              # JS/CSS bundles
│
├── data/                     # Application Data
│   ├── pbidocs.db           # SQLite database
│   └── areas.json           # Areas configuration
│
├── pdfs/                     # User-uploaded PDFs
│
├── main.py                  # FastAPI entry point
├── render.yaml              # Render.com deployment config
└── .env                     # Environment variables
```

---

## Architecture Overview

### Backend (Python/FastAPI)

**Authentication Flow:**
```
User Login
  ↓
POST /api/auth/login (email, password)
  ↓
Backend validates credentials
  ↓
Creates JWT token
  ↓
Sets httpOnly Secure Cookie (auth_token)
  ↓
Returns user data
  ↓
Browser stores cookie automatically
```

**Database:**
- SQLite for development
- PostgreSQL for production (via DATABASE_URL)
- Models: Users, Reportes, Areas, AuditLog

**API Endpoints:**
- `/api/auth/` - Authentication (login, logout, password change)
- `/api/users/` - User management (admin only)
- `/api/reportes/` - Report CRUD
- `/api/areas/` - Areas management
- `/api/stats/` - Dashboard statistics
- `/api/notifications/` - User notifications
- `/api/audit-log/` - Activity logs (admin only)

### Frontend (React/Vite)

**State Management:**
- Zustand for global state (user, reportes, activeTab, etc.)
- No Redux complexity - just simple store

**Component Structure:**
- **App.tsx** - Main app router & session management
- **Sidebar** - Navigation & report list
- **TopBar** - Breadcrumb, search, notifications
- **DocView** - Report detail view with tabs
- **Modals** - Create/edit reports, user management, file uploads
- **Tabs** - Resumen, Modelo, Columnas, Medidas, Fuente, PDF, Notificaciones, Guía

**Styling:**
- Tailwind CSS (utility-first)
- Dark mode support (CSS custom properties + dark: variants)
- GSAP for animations

### Security Features

1. **Authentication:**
   - JWT tokens in httpOnly cookies (not localStorage)
   - Cookie-based session management
   - 12-hour token expiration

2. **Authorization:**
   - Role-based access control (admin vs editor)
   - Admin-only endpoints protected with `require_admin` dependency

3. **Input Validation:**
   - Password complexity (12+ chars, uppercase, numbers, special chars)
   - Email format validation
   - SQL injection prevention (SQLite parameter binding)

4. **CORS:**
   - Explicit allowed origins
   - Credentials mode enabled for cookies

5. **Security Headers:**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Strict-Transport-Security (HSTS)
   - Content-Security-Policy

6. **Rate Limiting:**
   - Login: 5 attempts per minute per IP

---

## Data Flow

### Creating a Report

```
User clicks "Nuevo Reporte"
  ↓
ReporteModal opens
  ↓
User fills form & submits
  ↓
Frontend: POST /api/reportes
  ↓
Backend: Validate input
  ↓
Backend: Create in database
  ↓
Backend: Log audit event
  ↓
Frontend: Update state (setReportes)
  ↓
Redirect to new report
```

### Uploading JSON Documentation

```
User clicks "Subir JSON"
  ↓
JsonUploadModal opens
  ↓
User selects JSON file
  ↓
Frontend: POST /api/reportes/upload-json
  ↓
Backend: Parse JSON
  ↓
Backend: Create Reporte from JSON
  ↓
Backend: Return report ID
  ↓
Frontend: Redirect to new report
```

### Dashboard Statistics

```
Homepage loads
  ↓
Frontend: GET /api/stats
  ↓
Backend: Query database for:
  - Total reports by status
  - Reports by direction/area
  - Recent activity
  ↓
Frontend: Render charts with D3.js
```

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | FastAPI | Web framework |
| **Database** | SQLite / PostgreSQL | Data persistence |
| **Auth** | PyJWT | JWT token generation |
| **Frontend** | React 18 | UI framework |
| **Build** | Vite | Fast bundler |
| **Styling** | Tailwind CSS | Utility CSS |
| **State** | Zustand | State management |
| **Animations** | GSAP | Advanced animations |
| **Charts** | D3.js | Data visualization |
| **Icons** | Lucide React | Icon library |
| **Deployment** | Render.com | Hosting platform |

---

## Development Workflow

### Local Development

```bash
# Terminal 1 - Backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev  # Runs on http://localhost:5173
```

### Code Organization

- **Backend changes** - Just save, uvicorn reloads automatically
- **Frontend changes** - Just save, Vite HMR updates instantly
- **CSS changes** - Tailwind watches and compiles automatically

### Database

- Development uses SQLite (`data/pbidocs.db`)
- Migrations are implicit (schema created on first run)
- Seed data in `data/areas.json`

---

## Performance Optimizations

1. **Frontend:**
   - Code splitting with Vite
   - Lazy loading components with React.lazy
   - GSAP animations (hardware-accelerated)
   - D3.js charts (efficient rendering)

2. **Backend:**
   - FastAPI (async/await)
   - SQLite with proper indexing
   - Response caching where appropriate
   - PDF generation on-demand

3. **Browser:**
   - Dark mode CSS variables (no runtime overhead)
   - Tailwind CSS (minimal CSS with PurgeCSS)
   - HTTP/2 push with static files

---

## Deployment (Render.com)

**Environment Variables:**
```
SECRET_KEY=<generated>
ADMIN_DEFAULT_PASSWORD=<generated>
ADMIN_DEFAULT_EMAIL=<your-email>
ALLOWED_ORIGINS=https://yourdomain.com
```

**Build Process:**
```yaml
build:
  - pip install -r requirements.txt
  - cd frontend && npm install && npm run build
  - Vite builds to static-react/
```

**Runtime:**
```bash
python main.py  # Serves both backend & frontend
```

---

## Future Enhancements

- [ ] Power BI integration (export to Power BI)
- [ ] Databricks integration (AI documentation)
- [ ] Two-factor authentication
- [ ] Real-time collaboration
- [ ] Version history for reports
- [ ] Advanced search (Elasticsearch)
- [ ] Webhooks for external integrations

---

*Last Updated: 2026-03-30*
