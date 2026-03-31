# 💻 LOCAL DEVELOPMENT SETUP GUIDE

## 🚨 Problema: "Python was not found"

**Solución:** Python no está instalado o no está en el PATH de Windows.

---

## ✅ Paso 1: Instalar Python 3.13

### Opción A: Instalador oficial (Recomendado)
1. Descarga: https://www.python.org/downloads/
2. **IMPORTANTE:** En el instalador, marca estas opciones:
   ```
   ☑ Install Python 3.13 for all users
   ☑ Add python.exe to PATH  ← CRUCIAL!
   ☑ Install pip
   ☑ Install venv
   ```
3. Haz clic en "Install Now"
4. Espera a que termine

### Opción B: Windows Package Manager (rápido)
```powershell
# Si tienes Windows Package Manager
winget install Python.Python.3.13
```

### Opción C: Chocolatey
```powershell
choco install python --version=3.13.0
```

### Verificar Instalación
```bash
python --version
# Debe mostrar: Python 3.13.x

pip --version
# Debe mostrar: pip xxx from ...
```

---

## ✅ Paso 2: Instalar Node.js (para React frontend)

### Opción A: nodejs.org (Recomendado)
1. Descarga: https://nodejs.org/ (LTS version)
2. Ejecuta el instalador
3. Sigue las instrucciones por defecto
4. **Reinicia PowerShell/Terminal después**

### Opción B: Winget
```powershell
winget install OpenJS.NodeJS
```

### Verificar Instalación
```bash
node --version
# Debe mostrar: v20.x.x

npm --version
# Debe mostrar: 10.x.x
```

---

## ✅ Paso 3: Clonar y Preparar Proyecto

```bash
# 1. Navega a tu directorio de trabajo
cd /c/Users/giova/OneDrive/Escritorio

# 2. El proyecto ya está aquí (BI-Hub)
cd BI-Hub

# 3. Verifica que estés en la rama main
git branch
# Debe mostrar: * main

# 4. Actualiza a los últimos cambios
git pull origin main
```

---

## ✅ Paso 4: Instalar Dependencias Backend

```bash
# 1. Crea un entorno virtual (recomendado)
python -m venv venv

# 2. Activa el entorno virtual
# En PowerShell:
.\venv\Scripts\Activate.ps1

# En CMD:
venv\Scripts\activate.bat

# En Git Bash:
source venv/Scripts/activate

# Deberías ver: (venv) en tu prompt

# 3. Instala las dependencias
pip install -r requirements.txt

# Esto instala:
# - fastapi (backend framework)
# - sqlalchemy (database ORM)
# - pydantic (data validation)
# - pyjwt (authentication)
# - python-multipart (file uploads)
```

### Solucionar Problemas de Instalación

**Error: "pip: command not found"**
```bash
# Intenta con python -m pip
python -m pip install -r requirements.txt
```

**Error: "No module named 'pip'"**
```bash
# Reinstala pip
python -m ensurepip --upgrade
```

**Error: "Permission denied"**
```bash
# Ejecuta PowerShell como Administrador, luego intenta de nuevo
```

---

## ✅ Paso 5: Instalar Dependencias Frontend

```bash
# 1. Navega a la carpeta frontend
cd frontend

# 2. Instala las dependencias de npm
npm install

# Esto instala:
# - react (UI library)
# - vite (build tool)
# - typescript (type safety)
# - tailwindcss (styling)
# - lucide-react (icons)

# 3. Regresa a la raíz
cd ..
```

---

## ✅ Paso 6: Configurar Variables de Entorno

```bash
# 1. Crea un archivo .env en la raíz (copiar de .env.example)
cp .env.example .env

# 2. Edita .env con tus valores locales
# Windows: notepad .env
# VSCode: code .env

# Contenido mínimo para desarrollo local:
SECRET_KEY=development-secret-key-change-this
ADMIN_DEFAULT_PASSWORD=TempPassword123!
ADMIN_DEFAULT_EMAIL=admin@local.test
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000

# Para desarrollo, las siguientes son opcionales:
# DATABASE_URL=sqlite:///./pbi_hub.db  (default)
```

---

## 🚀 Paso 7: Ejecutar la Aplicación

### Opción A: Ejecutar Backend y Frontend Separadamente (Recomendado)

**Terminal 1 - Backend:**
```bash
# Asegúrate de estar en la raíz del proyecto
# Y con el venv activado: (venv) debe estar visible

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Output esperado:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

**Terminal 2 - Frontend (en carpeta frontend/):**
```bash
cd frontend

npm run dev

# Output esperado:
#   VITE v4.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/
```

### Opción B: Ejecutar con Build Script

```bash
# Ejecuta el build.sh (Windows Git Bash)
bash build.sh

# Luego inicia el servidor
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

## 🌐 Acceder a la Aplicación

### Frontend (React)
```
http://localhost:5173
```
- Vite dev server con hot reload
- Cambios en React se ven al instante

### Backend (API)
```
http://127.0.0.1:8000
```
- FastAPI server
- Documentación: http://127.0.0.1:8000/docs (Swagger)

### Swagger UI (API Docs)
```
http://127.0.0.1:8000/docs
```
- Prueba endpoints sin cliente
- Ver esquema de datos

---

## 🔐 Login Local

**Email:** admin@local.test (o tu ADMIN_DEFAULT_EMAIL)
**Password:** TempPassword123! (o tu ADMIN_DEFAULT_PASSWORD)

⚠️ **Nota:** Si es la primera vez, la BD se crea automáticamente.

---

## 🆘 Solución de Problemas

### Problema: "Port 8000 already in use"

```bash
# Opción 1: Usa otro puerto
python -m uvicorn main:app --reload --port 8001

# Opción 2: Cierra el proceso que usa el puerto
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8000
kill -9 <PID>
```

### Problema: "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Asegúrate de que el venv está activado
# Deberías ver (venv) en tu prompt

# Si no está activado:
.\venv\Scripts\Activate.ps1  # PowerShell
# o
source venv/Scripts/activate  # Git Bash

# Luego reinstala:
pip install -r requirements.txt
```

### Problema: "CORS error: Access to XMLHttpRequest denied"

Este es **esperado en desarrollo** si frontend y backend están en puertos diferentes.

**Solución:**
- Frontend está en http://localhost:5173
- Backend debe permitir esa origen en ALLOWED_ORIGINS
- Ya está configurado en .env para desarrollo

### Problema: "Database is locked"

```bash
# SQLite a veces queda bloqueada
# Solución: elimina la BD y deja que se recree

# Windows:
del data/pbi_hub.db

# Linux/Mac:
rm data/pbi_hub.db

# Luego reinicia el servidor
```

### Problema: "npm: command not found"

```bash
# Node.js no está en el PATH
# Soluciones:
# 1. Reinstala Node.js (marca "Add to PATH")
# 2. Usa winget:
winget install OpenJS.NodeJS
# 3. Reinicia PowerShell después de instalar
```

### Problema: React no se compila

```bash
# En carpeta frontend/:

# Limpia cache de npm
npm cache clean --force

# Elimina node_modules
rm -r node_modules package-lock.json

# Reinstala
npm install

# Intenta de nuevo
npm run dev
```

---

## 📝 Workflow de Desarrollo

### Cambios en Backend (Python)
1. Edita archivos en `app/` o `main.py`
2. Uvicorn recarga automáticamente (--reload)
3. Refresh navegador

### Cambios en Frontend (React/Vite)
1. Edita archivos en `frontend/src/`
2. Vite recarga automáticamente (HMR)
3. Cambios aparecen instant en navegador

### Cambios en Estilos (Tailwind)
1. Edita clases en `frontend/src/`
2. Tailwind recompila automáticamente
3. Estilos se actualizan en tiempo real

---

## 🧪 Testing Local

### Verificar Backend
```bash
# En otra terminal, con curl:
curl http://127.0.0.1:8000/api/auth/me

# Debe retornar 401 (no autenticado)
# Si retorna error de conexión = servidor no está corriendo
```

### Verificar Frontend
```bash
# En navegador:
http://localhost:5173

# Deberías ver:
# - Login form
# - NADRO logo
# - Sin errores en consola
```

### Ver Logs
```bash
# Backend logs: aparecen en Terminal 1
# Frontend logs: aparecen en Terminal 2
# Console del navegador: F12 → Console tab
```

---

## 📦 Build para Producción

Cuando estés listo para producción (como en Render):

```bash
# 1. Build React
cd frontend
npm run build
cd ..

# 2. Copia archivos estáticos (ya lo hace npm run build)

# 3. Ejecuta con uvicorn (sin --reload)
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# El servidor sirve React estático + API
```

---

## ✅ Checklist de Setup Completo

- [ ] Python 3.13 instalado y en PATH
- [ ] Node.js 20 instalado y en PATH
- [ ] pip y npm funcionando
- [ ] Repositorio clonado
- [ ] requirements.txt instalado
- [ ] node_modules instalado
- [ ] .env creado con valores locales
- [ ] Backend corre sin errores (Terminal 1)
- [ ] Frontend corre sin errores (Terminal 2)
- [ ] Puedo acceder a http://localhost:5173
- [ ] Puedo ver http://127.0.0.1:8000/docs
- [ ] Puedo hacer login (admin@local.test)

---

## 🎯 Próximos Pasos

Si todo funciona:
1. ✅ Experimenta con la app
2. ✅ Haz cambios en código
3. ✅ Observa hot-reload funcionando
4. ✅ Cuando estés listo, haz push a main para deploy en Render

---

## 📞 Ayuda Rápida

| Problema | Comando |
|----------|---------|
| "Python no encontrado" | `py --version` o reinstala |
| "pip no funciona" | `python -m pip install ...` |
| "npm no funciona" | Reinstala Node.js |
| "Activar venv" | `.\venv\Scripts\Activate.ps1` |
| "Puerto en uso" | `python -m uvicorn main:app --port 8001` |
| "BD bloqueada" | `del data/pbi_hub.db` |
| "Ver logs" | Check Terminal donde corre servidor |

---

*Last Updated: 2024-03-30*
*For production deployment, see SECURITY.md and DEPLOYMENT_STATUS.md*
