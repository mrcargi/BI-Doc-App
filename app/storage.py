"""
storage.py — Lee y escribe los archivos JSON de datos.
Todos los datos viven en /data/reportes.json y /data/areas.json
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import date

DATA_DIR = Path(__file__).parent.parent / "data"
REPORTES_FILE = DATA_DIR / "reportes.json"
AREAS_FILE    = DATA_DIR / "areas.json"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _read(path: Path) -> Dict:
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _write(path: Path, data: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _today() -> str:
    return date.today().isoformat()


# ── Reportes ──────────────────────────────────────────────────────────────────

def get_all_reportes() -> List[Dict]:
    data = _read(REPORTES_FILE)
    return data.get("reportes", [])

def get_reporte(reporte_id: str) -> Optional[Dict]:
    reportes = get_all_reportes()
    return next((r for r in reportes if r["id"] == reporte_id), None)

def create_reporte(reporte: Dict) -> Dict:
    data = _read(REPORTES_FILE)
    reportes = data.get("reportes", [])

    # Ensure unique ID
    base_id = reporte["id"]
    existing_ids = {r["id"] for r in reportes}
    if base_id in existing_ids:
        counter = 2
        while f"{base_id}-{counter}" in existing_ids:
            counter += 1
        reporte["id"] = f"{base_id}-{counter}"

    reporte.setdefault("createdAt", _today())
    reporte.setdefault("updatedAt", _today())
    reportes.append(reporte)
    _write(REPORTES_FILE, {"reportes": reportes})
    return reporte

def update_reporte(reporte_id: str, updates: Dict) -> Optional[Dict]:
    data = _read(REPORTES_FILE)
    reportes = data.get("reportes", [])

    for i, r in enumerate(reportes):
        if r["id"] == reporte_id:
            reportes[i] = {**r, **updates, "updatedAt": _today()}
            _write(REPORTES_FILE, {"reportes": reportes})
            return reportes[i]
    return None

def delete_reporte(reporte_id: str) -> bool:
    data = _read(REPORTES_FILE)
    reportes = data.get("reportes", [])
    new_reportes = [r for r in reportes if r["id"] != reporte_id]

    if len(new_reportes) == len(reportes):
        return False  # Not found

    _write(REPORTES_FILE, {"reportes": new_reportes})
    return True

def search_reportes(
    q: Optional[str] = None,
    direccion: Optional[str] = None,
    area: Optional[str] = None,
    estado: Optional[str] = None,
    tags: Optional[str] = None,
) -> List[Dict]:
    reportes = get_all_reportes()

    if q:
        q_lower = q.lower()
        reportes = [
            r for r in reportes
            if q_lower in r.get("name", "").lower()
            or q_lower in r.get("desc", "").lower()
            or q_lower in r.get("area", "").lower()
            or q_lower in r.get("direccion", "").lower()
            or any(q_lower in tag.lower() for tag in r.get("tags", []))
        ]

    if direccion:
        reportes = [r for r in reportes if direccion.lower() in r.get("direccion", "").lower()]

    if area:
        reportes = [r for r in reportes if area.lower() in r.get("area", "").lower()]

    if estado:
        reportes = [r for r in reportes if r.get("estado") == estado]

    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",")]
        reportes = [
            r for r in reportes
            if any(t in [tag.lower() for tag in r.get("tags", [])] for t in tag_list)
        ]

    return reportes


# ── Areas ─────────────────────────────────────────────────────────────────────

def get_all_areas() -> List[Dict]:
    data = _read(AREAS_FILE)
    return data.get("areas", [])

def get_area(area_id: str) -> Optional[Dict]:
    areas = get_all_areas()
    return next((a for a in areas if a["id"] == area_id), None)

def create_area(area: Dict) -> Dict:
    data = _read(AREAS_FILE)
    areas = data.get("areas", [])

    existing_ids = {a["id"] for a in areas}
    if area["id"] in existing_ids:
        counter = 2
        base = area["id"]
        while f"{base}-{counter}" in existing_ids:
            counter += 1
        area["id"] = f"{base}-{counter}"

    areas.append(area)
    _write(AREAS_FILE, {"areas": areas})
    return area

def update_area(area_id: str, updates: Dict) -> Optional[Dict]:
    data = _read(AREAS_FILE)
    areas = data.get("areas", [])

    for i, a in enumerate(areas):
        if a["id"] == area_id:
            areas[i] = {**a, **updates}
            _write(AREAS_FILE, {"areas": areas})
            return areas[i]
    return None

def delete_area(area_id: str) -> bool:
    data = _read(AREAS_FILE)
    areas = data.get("areas", [])
    new_areas = [a for a in areas if a["id"] != area_id]

    if len(new_areas) == len(areas):
        return False

    _write(AREAS_FILE, {"areas": new_areas})
    return True

def get_stats() -> Dict:
    reportes = get_all_reportes()
    areas    = get_all_areas()

    by_direccion: Dict[str, int] = {}
    by_estado: Dict[str, int] = {}

    for r in reportes:
        d = r.get("direccion", "Sin dirección")
        by_direccion[d] = by_direccion.get(d, 0) + 1
        e = r.get("estado", "activo")
        by_estado[e] = by_estado.get(e, 0) + 1

    return {
        "total_reportes": len(reportes),
        "total_areas":    len(areas),
        "by_direccion":   by_direccion,
        "by_estado":      by_estado,
    }
