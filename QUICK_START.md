# ⚡ QUICK START - LOCAL DEVELOPMENT

## 🚀 Opción 1: Setup Automático (RECOMENDADO)

### Windows (PowerShell)
```powershell
# 1. Abre PowerShell en la carpeta del proyecto
# 2. Ejecuta:
.\setup.ps1

# Automáticamente:
# ✅ Verifica Python e instala si falta
# ✅ Verifica Node.js e instala si falta
# ✅ Crea virtual environment
# ✅ Instala todas las dependencias
# ✅ Crea .env file
```

### Mac/Linux (Bash)
```bash
# 1. Abre terminal en la carpeta del proyecto
# 2. Ejecuta:
bash setup.sh

# Automáticamente:
# ✅ Verifica Python3 e instala si falta
# ✅ Verifica Node.js e instala si falta
# ✅ Crea virtual environment
# ✅ Instala todas las dependencias
# ✅ Crea .env file
```

---

## 🚀 Opción 2: Setup Manual

### Windows (PowerShell)

```powershell
# 1. Crea virtual environment
python -m venv venv

# 2. Actívalo
.\venv\Scripts\Activate.ps1

# 3. Instala dependencias Python
pip install -r requirements.txt

# 4. Instala dependencias Node
cd frontend
npm install
cd ..

# 5. Copia .env.example a .env
copy .env.example .env
```

### Mac/Linux (Bash)

```bash
# 1. Crea virtual environment
python3 -m venv venv

# 2. Actívalo
source venv/bin/activate

# 3. Instala dependencias Python
pip install -r requirements.txt

# 4. Instala dependencias Node
cd frontend
npm install
cd ..

# 5. Copia .env.example a .env
cp .env.example .env
```

---

## ▶️ EJECUTAR LA APLICACIÓN

### Abre 2 Terminales/Tabs

**Terminal 1: Backend (FastAPI)**
```bash
# Asegúrate de activar venv primero
# Windows: .\venv\Scripts\Activate.ps1
# Linux/Mac: source venv/bin/activate

python -m uvicorn main:app --reload --port 8000

# Deberías ver:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

**Terminal 2: Frontend (React + Vite)**
```bash
cd frontend
npm run dev

# Deberías ver:
#   VITE v5.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/
```

---

## 🌐 ACCEDER A LA APP

| Componente | URL | Propósito |
|-----------|-----|----------|
| **Frontend (React)** | http://localhost:5173 | ⭐ AQUÍ VAS |
| **Backend (API)** | http://127.0.0.1:8000 | Servidor FastAPI |
| **API Docs (Swagger)** | http://127.0.0.1:8000/docs | Prueba endpoints |

---

## 🔐 LOGIN

```
Email:    admin@local.test
Password: TempPassword123!
```

(O los valores que pusiste en .env)

---

## 🚨 PROBLEMAS COMUNES

### ❌ "Python was not found"
```bash
# Python no está instalado
# Descarga: https://www.python.org/downloads/
# ⚠️ MARCA: "Add python.exe to PATH"
```

### ❌ "pip: command not found"
```bash
# Usa python -m pip:
python -m pip install -r requirements.txt
```

### ❌ "Port 8000 already in use"
```bash
# Usa otro puerto:
python -m uvicorn main:app --reload --port 8001
```

### ❌ "npm: command not found"
```bash
# Node.js no está instalado
# Descarga: https://nodejs.org/ (LTS)
```

### ❌ "CORS error"
```bash
# Es normal en desarrollo (diferente puerto)
# Verifica ALLOWED_ORIGINS en .env:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000
```

### ❌ "ModuleNotFoundError: fastapi"
```bash
# Venv no está activado
# Windows: .\venv\Scripts\Activate.ps1
# Linux/Mac: source venv/bin/activate
```

---

## 📝 DEVELOPMENT WORKFLOW

### Cambios en Backend (Python)
```
1. Edita: app/routes.py, app/auth.py, etc
2. Uvicorn recarga automáticamente (--reload)
3. Refresh navegador F5
```

### Cambios en Frontend (React/Vite)
```
1. Edita: frontend/src/components/, etc
2. Vite actualiza automáticamente
3. Cambios aparecen al instante (HMR)
```

### Cambios en Estilos (Tailwind)
```
1. Edita clases en componentes
2. Tailwind recompila automáticamente
3. Estilos se aplican en tiempo real
```

---

## 📖 DOCUMENTACIÓN

| Archivo | Lee si... |
|---------|-----------|
| **LOCAL_SETUP.md** | Necesitas ayuda detallada con setup |
| **SECURITY.md** | Quieres entender la seguridad |
| **POST_DEPLOY.md** | Vamos a hacer deploy en Render |
| **SECURITY_FIXES_SUMMARY.md** | Quieres ver qué se arregló |

---

## ✅ CHECKLIST

- [ ] Python 3.13+ instalado
- [ ] Node.js 20+ instalado
- [ ] pip funciona: `pip --version`
- [ ] npm funciona: `npm --version`
- [ ] venv creado: `ls venv` (Windows: `dir venv`)
- [ ] .env file existe
- [ ] Backend corre sin errores
- [ ] Frontend corre sin errores
- [ ] Accedo a http://localhost:5173
- [ ] Puedo hacer login
- [ ] Puedo ver reportes/dashboard

---

## 🎯 Próximos Pasos

✅ **Desarrollo Local:**
1. Ejecuta ambas terminales
2. Haz cambios en código
3. Observa cambios en tiempo real

✅ **Cuando Estés Listo:**
1. `git add .`
2. `git commit -m "your changes"`
3. `git push origin main`
4. Render se actualiza automáticamente

✅ **Producción (Ya Deployado):**
- App corre en: https://bi-hub.onrender.com
- Deploy automático en cada push

---

## 💡 TIPS

```bash
# Ver documentación API
http://127.0.0.1:8000/docs

# Reiniciar limpio (eliminar DB SQLite)
rm data/pbi_hub.db

# Actualizar dependencias
pip install -r requirements.txt --upgrade
npm update --save

# Ver qué corre en puerto 8000
# Windows: netstat -ano | findstr :8000
# Linux/Mac: lsof -i :8000

# Cambiar puerto frontend
cd frontend
npm run dev -- --port 3000
```

---

## 🎉 ¡LISTO!

Ahora deberías poder:
- ✅ Ejecutar en localhost
- ✅ Hacer cambios en código
- ✅ Ver cambios en tiempo real
- ✅ Hacer deploy en Render

**Cualquier problema?** Lee LOCAL_SETUP.md para soluciones detalladas.

---

*Quick Start v1.0 - 2024-03-30*
