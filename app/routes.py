"""
routes.py — Todos los endpoints de la API PBI Docs (con autenticación)
"""
import re
import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends, Body
from fastapi.responses import JSONResponse, Response

from app import database as db
from app.auth import create_token, authenticate_user, get_current_user, require_admin
from app.models import (
    Reporte, ReporteCreate, ReporteUpdate, ReporteList, SearchResult,
    Area, AreaCreate, AreaUpdate, AreaList, MessageResponse,
    LoginRequest, PasswordChange, UserCreate, UserUpdate,
)
from app.pdf_export import generate_report_pdf_with_attachment

router = APIRouter()
PDFS_DIR = Path(__file__).parent.parent / "pdfs"
PDFS_DIR.mkdir(exist_ok=True)
MAX_PDF_MB = 50
VALID_DIRS = []

# ═══ AUTH ═══════════════════════════════════════════════════════
@router.post("/auth/login", summary="Iniciar sesión")
def login(payload: LoginRequest):
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(401, "Credenciales inválidas")
    token = create_token(user['id'], user['role'])
    db.log_action(user['id'], 'login')
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role']}}

@router.get("/auth/me", summary="Usuario actual")
def get_me(user=Depends(get_current_user)):
    return user

@router.put("/auth/password", summary="Cambiar contraseña")
def change_password(payload: PasswordChange, user=Depends(get_current_user)):
    if len(payload.password) < 6: raise HTTPException(400, "Mínimo 6 caracteres")
    db.update_user_password(user['id'], payload.password)
    return {"ok": True, "message": "Contraseña actualizada"}

# ═══ USERS (admin) ═════════════════════════════════════════════
@router.get("/users", summary="Listar usuarios")
def list_users(admin=Depends(require_admin)):
    return {"items": db.get_all_users()}

@router.post("/users", summary="Crear usuario")
def create_user_endpoint(payload: UserCreate, admin=Depends(require_admin)):
    if payload.role not in ('admin','editor'): raise HTTPException(400, "Rol inválido")
    if len(payload.password) < 6: raise HTTPException(400, "Contraseña mínimo 6 caracteres")
    user = db.create_user(payload.email, payload.password, payload.name, payload.role)
    if not user: raise HTTPException(409, "Email ya registrado")
    db.log_action(admin['id'], 'create_user', 'user', str(user['id']))
    return {"ok": True, "user": {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role']}}

@router.put("/users/{user_id}", summary="Editar usuario")
def update_user_endpoint(user_id: int, payload: UserUpdate, admin=Depends(require_admin)):
    updates = {}
    if payload.name is not None: updates["name"] = payload.name
    if payload.role is not None and payload.role in ('admin','editor'): updates["role"] = payload.role
    if payload.is_active is not None: updates["is_active"] = 1 if payload.is_active else 0
    if payload.email is not None: updates["email"] = payload.email.lower().strip()
    result = db.update_user(user_id, updates)
    if not result: raise HTTPException(404, "Usuario no encontrado")
    return {"ok": True, "user": result}

@router.put("/users/{user_id}/password", summary="Reset contraseña")
def reset_password(user_id: int, payload: PasswordChange, admin=Depends(require_admin)):
    if len(payload.password) < 6: raise HTTPException(400, "Mínimo 6 caracteres")
    db.update_user_password(user_id, payload.password)
    return {"ok": True, "message": "Contraseña reseteada"}

@router.delete("/users/{user_id}", summary="Eliminar usuario")
def delete_user_endpoint(user_id: int, admin=Depends(require_admin)):
    if admin["id"] == user_id:
        raise HTTPException(400, "No puedes eliminarte a ti mismo")
    result = db.delete_user(user_id)
    if not result:
        raise HTTPException(404, "Usuario no encontrado")
    return {"ok": True, "message": "Usuario eliminado"}

# ═══ JSON UPLOAD ═══════════════════════════════════════════════
@router.post("/upload-json", summary="Subir documentación completa vía JSON")
def upload_json(payload: dict = Body(...), user=Depends(get_current_user)):
    errors = []
    if not payload.get("name"): errors.append("Falta 'name'")
    if not payload.get("area"): errors.append("Falta 'area'")
    d = payload.get("direccion","")
    if not d: errors.append("Falta 'direccion'")
    if not isinstance(payload.get("tables"), list): errors.append("Falta 'tables' (array)")
    if not isinstance(payload.get("columns"), list): errors.append("Falta 'columns' (array)")
    if not isinstance(payload.get("folders"), list): errors.append("Falta 'folders' (array)")
    for i, t in enumerate(payload.get("tables",[])):
        if not t.get("name"): errors.append(f"tables[{i}]: falta 'name'")
        if t.get("type") not in ("import","calc","empty","param"): errors.append(f"tables[{i}]: type inválido")
    for i, c in enumerate(payload.get("columns",[])):
        if not c.get("n"): errors.append(f"columns[{i}]: falta 'n'")
    if errors:
        return JSONResponse(422, {"ok": False, "message": "JSON inválido", "errors": errors})

    rid = payload.get("id") or re.sub(r"[^a-z0-9]+", "-", payload["name"].lower()).strip("-")
    payload["id"] = rid
    for k, v in [("estado","activo"),("tags",[]),("compat","1567"),("color","#5C9868"),("emoji","📊"),("pdfFile",None),("relations",[]),("source",None)]:
        payload.setdefault(k, v)

    existing = db.get_reporte(rid)
    if existing:
        result = db.update_reporte(rid, payload)
        db.log_action(user['id'], 'update_json', 'reporte', rid)
        rname = payload.get("name", rid)
        db.notify_all_admins('reporte_updated', 'Reporte actualizado',
            f'{user["name"]} actualizo "{rname}" via JSON.', rid, actor_id=user['id'])
        if user['role'] != 'admin':
            db.create_notification(user['id'], 'reporte_updated', 'Reporte actualizado',
                f'Actualizaste "{rname}" via JSON.', rid, actor_id=user['id'])
        return {"ok": True, "message": f"Reporte '{rid}' actualizado", "reporte": result, "action": "updated"}
    else:
        result = db.create_reporte(payload, user_id=user['id'])
        db.log_action(user['id'], 'create_json', 'reporte', rid)
        rname = payload.get("name", rid)
        tables_count = len(payload.get("tables", []))
        measures_count = sum(len(f.get("measures", [])) for f in payload.get("folders", []))
        db.notify_all_admins('reporte_created', 'Nuevo reporte subido',
            f'{user["name"]} subio "{rname}" ({payload.get("area","")}) con {tables_count} tablas y {measures_count} medidas.', rid, actor_id=user['id'])
        if user['role'] != 'admin':
            db.create_notification(user['id'], 'reporte_created', 'Nuevo reporte creado',
                f'Subiste "{rname}" con {tables_count} tablas y {measures_count} medidas.', rid, actor_id=user['id'])
        return {"ok": True, "message": f"Reporte '{rid}' creado", "reporte": result, "action": "created"}

@router.post("/validate-json", summary="Validar JSON sin guardar")
def validate_json(payload: dict = Body(...), user=Depends(get_current_user)):
    errors, warnings = [], []
    if not payload.get("name"): errors.append("Falta 'name'")
    if not payload.get("area"): errors.append("Falta 'area'")
    d = payload.get("direccion","")
    if not d: errors.append("Falta 'direccion'")
    tables = payload.get("tables",[])
    if not isinstance(tables, list) or not tables: errors.append("Sin tablas")
    if not payload.get("desc"): warnings.append("Sin descripción")
    if not payload.get("tags"): warnings.append("Sin tags")
    if not payload.get("source"): warnings.append("Sin fuente de datos")
    rid = payload.get("id") or re.sub(r"[^a-z0-9]+", "-", payload.get("name","").lower()).strip("-")
    if db.get_reporte(rid): warnings.append(f"ID '{rid}' ya existe — se actualizará")
    tm = sum(len(f.get("measures",[])) for f in payload.get("folders",[]))
    return {"valid": not errors, "errors": errors, "warnings": warnings,
            "summary": {"id": rid, "name": payload.get("name",""), "tables": len(tables),
                        "columns": len(payload.get("columns",[])), "measures": tm,
                        "relations": len(payload.get("relations",[]))}}

# ═══ STATS ═════════════════════════════════════════════════════
@router.get("/stats", summary="Estadísticas")
def get_stats():
    return db.get_stats()

# ═══ BÚSQUEDA ══════════════════════════════════════════════════
@router.get("/buscar", response_model=SearchResult)
def buscar(q: Optional[str]=Query(None), direccion: Optional[str]=Query(None),
           area: Optional[str]=Query(None), estado: Optional[str]=Query(None), tags: Optional[str]=Query(None)):
    items = db.search_reportes(q=q, direccion=direccion, area=area, estado=estado, tags=tags)
    return SearchResult(total=len(items), query=q, direccion=direccion, area=area, estado=estado, items=items)

# ═══ REPORTES CRUD ═════════════════════════════════════════════
@router.get("/reportes", response_model=ReporteList)
def list_reportes():
    return ReporteList(total=len(db.get_all_reportes()), items=db.get_all_reportes())

@router.get("/reportes/{reporte_id}", response_model=Reporte)
def get_reporte_endpoint(reporte_id: str):
    r = db.get_reporte(reporte_id)
    if not r: raise HTTPException(404)
    r.pop('_created_by', None)
    return r

@router.post("/reportes", response_model=Reporte, status_code=201)
def create_reporte(payload: ReporteCreate, user=Depends(get_current_user)):
    rid = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
    d = {"id": rid, **payload.model_dump(), "tables":[],"relations":[],"columns":[],"folders":[],"source":None,"pdfFile":None}
    created = db.create_reporte(d, user_id=user['id'])
    db.log_action(user['id'], 'create_reporte', 'reporte', rid)
    db.notify_all_admins('reporte_created', 'Nuevo reporte creado',
        f'{user["name"]} creo el reporte "{payload.name}" en {payload.area}.', rid, actor_id=user['id'])
    if user['role'] != 'admin':
        db.create_notification(user['id'], 'reporte_created', 'Nuevo reporte creado',
            f'Creaste el reporte "{payload.name}" en {payload.area}.', rid, actor_id=user['id'])
    return created

@router.put("/reportes/{reporte_id}", response_model=Reporte)
def update_reporte(reporte_id: str, payload: ReporteUpdate, user=Depends(get_current_user)):
    existing = db.get_reporte(reporte_id)
    if not existing: raise HTTPException(404)
    if user['role'] == 'editor' and existing.get('_created_by') and existing['_created_by'] != user['id']:
        raise HTTPException(403, "Solo puedes editar tus propios reportes")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if payload.source is not None:
        updates["source"] = payload.source.model_dump() if payload.source else None
    result = db.update_reporte(reporte_id, updates)
    db.log_action(user['id'], 'update_reporte', 'reporte', reporte_id)
    result.pop('_created_by', None)
    return result

@router.delete("/reportes/{reporte_id}", response_model=MessageResponse)
def delete_reporte(reporte_id: str, admin=Depends(require_admin)):
    r = db.get_reporte(reporte_id)
    if r and r.get("pdfFile"):
        p = PDFS_DIR / r["pdfFile"]
        if p.exists(): p.unlink()
    if not db.delete_reporte(reporte_id): raise HTTPException(404)
    db.log_action(admin['id'], 'delete_reporte', 'reporte', reporte_id)
    return MessageResponse(ok=True, message="Eliminado", id=reporte_id)

# ═══ PDF ═══════════════════════════════════════════════════════
@router.post("/reportes/{reporte_id}/pdf", response_model=MessageResponse)
async def upload_pdf(reporte_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    r = db.get_reporte(reporte_id)
    if not r: raise HTTPException(404)
    if file.content_type != "application/pdf": raise HTTPException(400, "Solo PDFs")
    content = await file.read()
    if len(content) > MAX_PDF_MB*1024*1024: raise HTTPException(413)
    if r.get("pdfFile"):
        old = PDFS_DIR / r["pdfFile"]
        if old.exists(): old.unlink()
    fn = f"{reporte_id}.pdf"
    with open(PDFS_DIR / fn, "wb") as f: f.write(content)
    db.update_reporte(reporte_id, {"pdfFile": fn})
    return MessageResponse(ok=True, message="PDF subido", id=reporte_id)

@router.delete("/reportes/{reporte_id}/pdf", response_model=MessageResponse)
def delete_pdf(reporte_id: str, user=Depends(get_current_user)):
    r = db.get_reporte(reporte_id)
    if not r: raise HTTPException(404)
    if not r.get("pdfFile"): raise HTTPException(404, "Sin PDF")
    p = PDFS_DIR / r["pdfFile"]
    if p.exists(): p.unlink()
    db.update_reporte(reporte_id, {"pdfFile": None})
    return MessageResponse(ok=True, message="PDF eliminado", id=reporte_id)

@router.get("/reportes/{reporte_id}/export-pdf")
def export_pdf(reporte_id: str):
    r = db.get_reporte(reporte_id)
    if not r: raise HTTPException(404)
    r.pop('_created_by', None)
    pdf = generate_report_pdf_with_attachment(r, PDFS_DIR)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{reporte_id}-resumen.pdf"'})

# ═══ NOTIFICATIONS ═════════════════════════════════════════════
@router.get("/notifications")
def get_notifications(user=Depends(get_current_user)):
    items = db.get_notifications(user['id'])
    unread = db.get_unread_count(user['id'])
    return {"items": items, "unread": unread}

@router.put("/notifications/read-all")
def mark_all_read(user=Depends(get_current_user)):
    db.mark_all_notifications_read(user['id'])
    return {"ok": True}

@router.put("/notifications/{notif_id}/read")
def mark_read(notif_id: int, user=Depends(get_current_user)):
    db.mark_notification_read(notif_id, user['id'])
    return {"ok": True}

# ═══ AUDIT LOG ═════════════════════════════════════════════════
@router.get("/audit-log")
def audit_log(limit: int = Query(50, le=200), admin=Depends(require_admin)):
    return {"items": db.get_audit_log(limit)}

# ═══ ÁREAS ═════════════════════════════════════════════════════
@router.get("/areas", response_model=AreaList)
def list_areas():
    return AreaList(total=len(db.get_all_areas()), items=db.get_all_areas())

@router.get("/areas/{area_id}", response_model=Area)
def get_area(area_id: str):
    a = db.get_area(area_id)
    if not a: raise HTTPException(404)
    return a

@router.post("/areas", response_model=Area, status_code=201)
def create_area(payload: AreaCreate, admin=Depends(require_admin)):
    aid = re.sub(r"[^a-z0-9]+", "-", payload.nombre.lower()).strip("-")
    return db.create_area({"id": aid, **payload.model_dump()})

@router.put("/areas/{area_id}", response_model=Area)
def update_area(area_id: str, payload: AreaUpdate, admin=Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    result = db.update_area(area_id, updates)
    if not result: raise HTTPException(404)
    return result

@router.delete("/areas/{area_id}", response_model=MessageResponse)
def delete_area(area_id: str, admin=Depends(require_admin)):
    if not db.delete_area(area_id): raise HTTPException(404)
    return MessageResponse(ok=True, message="Área eliminada", id=area_id)
