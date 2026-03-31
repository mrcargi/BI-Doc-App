import os
from pathlib import Path

# Load .env variables BEFORE importing app modules
from dotenv import load_dotenv

# Load .env from project root
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)
print(f"📦 Loaded .env from: {env_path}")

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.routes import router
from app.database import bootstrap

BASE_DIR = Path(__file__).parent
REACT_DIR = BASE_DIR / "static-react"

# ── Bootstrap DB on startup ──
bootstrap()

app = FastAPI(
    title="PBI Docs API",
    description="Biblioteca de documentación de reportes Power BI — NADRO",
    version="3.0.0",
)

# ── CORS Configuration ──
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # Required for httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# ── Security Headers Middleware ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── API routes ──
app.include_router(router, prefix="/api")

# ── Static files ──
# Create directories if they don't exist
(BASE_DIR / "static").mkdir(exist_ok=True)
(BASE_DIR / "pdfs").mkdir(exist_ok=True)
REACT_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
app.mount("/pdfs", StaticFiles(directory=BASE_DIR / "pdfs"), name="pdfs")

# React build assets
if (REACT_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=REACT_DIR / "assets"), name="assets")

# ── SPA routing ──
@app.get("/", include_in_schema=False)
async def root():
    index = REACT_DIR / "index.html"
    if index.exists():
        return FileResponse(index)
    return FileResponse(BASE_DIR / "static" / "index.html")

@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    # Try to serve the file from React build first
    file_path = REACT_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    # Fallback to React SPA index
    index = REACT_DIR / "index.html"
    if index.exists():
        return FileResponse(index)
    return FileResponse(BASE_DIR / "static" / "index.html")
