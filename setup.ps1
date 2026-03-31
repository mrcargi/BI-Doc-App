# setup.ps1 - Automatic local development setup for Windows

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   BI-HUB LOCAL SETUP                   ║" -ForegroundColor Green
Write-Host "║   Automatic Environment Configuration  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green

# Check if running as admin (optional but recommended)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

# Step 1: Check Python
Write-Host "`n[1/6] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green
    $pythonPath = (python -c "import sys; print(sys.executable)" 2>&1)
    Write-Host "   Path: $pythonPath" -ForegroundColor DarkGray
} catch {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "   Install from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "   Make sure to check: 'Add python.exe to PATH'" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check Node.js
Write-Host "`n[2/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Found: $nodeVersion" -ForegroundColor Green
    $npmVersion = npm --version 2>&1
    Write-Host "   npm: $npmVersion" -ForegroundColor DarkGray
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Install from: https://nodejs.org/ (LTS)" -ForegroundColor Yellow
    Write-Host "   OR run: winget install OpenJS.NodeJS" -ForegroundColor Yellow
    exit 1
}

# Step 3: Create virtual environment
Write-Host "`n[3/6] Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "✅ Virtual environment exists" -ForegroundColor Green
} else {
    Write-Host "   Creating venv..." -ForegroundColor Gray
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Step 4: Activate venv and install Python dependencies
Write-Host "`n[4/6] Installing Python dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "   (venv) activated" -ForegroundColor Gray

if (Test-Path "requirements.txt") {
    Write-Host "   Installing from requirements.txt..." -ForegroundColor Gray
    pip install -r requirements.txt -q
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ requirements.txt not found!" -ForegroundColor Red
    exit 1
}

# Step 5: Install Node dependencies
Write-Host "`n[5/6] Installing Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\package.json") {
    Set-Location frontend
    Write-Host "   Running npm install in frontend/..." -ForegroundColor Gray
    npm install --silent
    Set-Location ..
    Write-Host "✅ Node dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend/package.json not found (optional)" -ForegroundColor Yellow
}

# Step 6: Create .env file
Write-Host "`n[6/6] Setting up environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    Write-Host "   (Review and update if needed)" -ForegroundColor DarkGray
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env from .env.example" -ForegroundColor Green
        Write-Host "   Review contents and update if needed" -ForegroundColor DarkGray
    } else {
        Write-Host "⚠️  .env.example not found" -ForegroundColor Yellow
        Write-Host "   Create .env manually with required variables:" -ForegroundColor DarkGray
        Write-Host "   - SECRET_KEY" -ForegroundColor DarkGray
        Write-Host "   - ADMIN_DEFAULT_PASSWORD" -ForegroundColor DarkGray
        Write-Host "   - ADMIN_DEFAULT_EMAIL" -ForegroundColor DarkGray
    }
}

# Success message
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ SETUP COMPLETE!                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open 2 terminal windows/tabs" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "  python -m uvicorn main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed help, see: LOCAL_SETUP.md" -ForegroundColor Cyan

# Offer to open VSCode
Write-Host "`n❓ Open VSCode in current folder? (y/n)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "y" -or $response -eq "Y") {
    code .
}

Write-Host ""
