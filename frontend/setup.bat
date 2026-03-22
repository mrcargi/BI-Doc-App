@echo off
echo ═══════════════════════════════════════════════
echo   PBI Docs — Frontend Setup (React + Vite)
echo ═══════════════════════════════════════════════
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Instala desde https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo npm install
    pause
    exit /b 1
)

echo [2/3] Compilando frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la compilacion
    pause
    exit /b 1
)

echo [3/3] Listo!
echo.
echo El frontend se compilo en ../static-react/
echo Ahora inicia el servidor con: python -m uvicorn main:app --reload --port 8000
echo.
pause
