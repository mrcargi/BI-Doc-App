@echo off
title PBI Docs — Servidor
color 0A

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        PBI Docs — NADRO              ║
echo  ║   Iniciando servidor FastAPI...      ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo  [1/3] Creando entorno virtual Python...
    python -m venv venv
    echo  [2/3] Instalando dependencias...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet
) else (
    call venv\Scripts\activate.bat
)

echo  [OK] Entorno listo.
echo.
echo  Abriendo: http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Presiona Ctrl+C para detener el servidor.
echo.

:: Open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Start FastAPI
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude "data/*"

pause
