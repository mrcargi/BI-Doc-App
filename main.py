from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

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

# ── API routes ──
app.include_router(router, prefix="/api")

# ── Static files ──
# Legacy static (logos, etc.)
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
