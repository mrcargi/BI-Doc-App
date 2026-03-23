"""
database.py — SQLite database layer for PBI Docs.
Replaces JSON file storage. Ready to swap to PostgreSQL for cloud deploy.
"""
import sqlite3
import json
import os
import hashlib
import secrets
from pathlib import Path
from datetime import date, datetime
from typing import Dict, Any, List, Optional

DB_PATH = Path(__file__).parent.parent / "data" / "pbidocs.db"
DATA_DIR = Path(__file__).parent.parent / "data"

def get_db() -> sqlite3.Connection:
    """Get a database connection with row_factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL DEFAULT 'editor' CHECK(role IN ('admin', 'editor')),
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (date('now')),
            last_login TEXT
        );

        CREATE TABLE IF NOT EXISTS reportes (
            id TEXT PRIMARY KEY,
            data JSON NOT NULL,
            created_by INTEGER REFERENCES users(id),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS areas (
            id TEXT PRIMARY KEY,
            data JSON NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            details TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            actor_id INTEGER REFERENCES users(id),
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL DEFAULT '',
            reporte_id TEXT,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()

# ── Password Hashing (stdlib, no external deps) ─────────────────
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000)
    return f"{salt}:{h.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(':')
        check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000)
        return check.hex() == h
    except Exception:
        return False

# ── Users ────────────────────────────────────────────────────────
def create_user(email: str, password: str, name: str, role: str = 'editor') -> Optional[Dict]:
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
            (email.lower().strip(), hash_password(password), name, role)
        )
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
        return dict(user) if user else None
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_email(email: str) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_users() -> List[Dict]:
    conn = get_db()
    rows = conn.execute("SELECT id, email, name, role, is_active, created_at, last_login FROM users ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_user(user_id: int, updates: Dict) -> Optional[Dict]:
    conn = get_db()
    allowed = ['name', 'role', 'is_active', 'email']
    sets = []
    vals = []
    for k, v in updates.items():
        if k in allowed:
            sets.append(f"{k} = ?")
            vals.append(v)
    if not sets:
        conn.close()
        return get_user_by_id(user_id)
    vals.append(user_id)
    conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = ?", vals)
    conn.commit()
    row = conn.execute("SELECT id, email, name, role, is_active, created_at, last_login FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def update_user_password(user_id: int, new_password: str) -> bool:
    conn = get_db()
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), user_id))
    conn.commit()
    conn.close()
    return True

def delete_user(user_id: int) -> bool:
    conn = get_db()
    cursor = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

def update_last_login(user_id: int):
    conn = get_db()
    conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (datetime.now().isoformat(), user_id))
    conn.commit()
    conn.close()

# ── Reportes ─────────────────────────────────────────────────────
def _today():
    return date.today().isoformat()

def get_all_reportes() -> List[Dict]:
    conn = get_db()
    rows = conn.execute("SELECT id, data, created_by FROM reportes ORDER BY json_extract(data, '$.name')").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = json.loads(r['data'])
        d['id'] = r['id']
        result.append(d)
    return result

def get_reporte(reporte_id: str) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT id, data, created_by FROM reportes WHERE id = ?", (reporte_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = json.loads(row['data'])
    d['id'] = row['id']
    d['_created_by'] = row['created_by']
    return d

def create_reporte(reporte: Dict, user_id: int = None) -> Dict:
    conn = get_db()
    reporte_id = reporte.get('id', '')
    
    # Ensure unique ID
    existing = conn.execute("SELECT id FROM reportes WHERE id = ?", (reporte_id,)).fetchone()
    if existing:
        counter = 2
        while conn.execute("SELECT id FROM reportes WHERE id = ?", (f"{reporte_id}-{counter}",)).fetchone():
            counter += 1
        reporte_id = f"{reporte_id}-{counter}"
    
    reporte['id'] = reporte_id
    reporte.setdefault('createdAt', _today())
    reporte.setdefault('updatedAt', _today())
    
    data_json = json.dumps(reporte, ensure_ascii=False)
    conn.execute(
        "INSERT INTO reportes (id, data, created_by) VALUES (?, ?, ?)",
        (reporte_id, data_json, user_id)
    )
    conn.commit()
    conn.close()
    return reporte

def update_reporte(reporte_id: str, updates: Dict) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT data FROM reportes WHERE id = ?", (reporte_id,)).fetchone()
    if not row:
        conn.close()
        return None
    
    current = json.loads(row['data'])
    current.update(updates)
    current['updatedAt'] = _today()
    current['id'] = reporte_id
    
    conn.execute(
        "UPDATE reportes SET data = ?, updated_at = ? WHERE id = ?",
        (json.dumps(current, ensure_ascii=False), datetime.now().isoformat(), reporte_id)
    )
    conn.commit()
    conn.close()
    return current

def delete_reporte(reporte_id: str) -> bool:
    conn = get_db()
    cursor = conn.execute("DELETE FROM reportes WHERE id = ?", (reporte_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def search_reportes(q=None, direccion=None, area=None, estado=None, tags=None) -> List[Dict]:
    reportes = get_all_reportes()
    if q:
        ql = q.lower()
        reportes = [r for r in reportes if ql in r.get('name','').lower() or ql in r.get('desc','').lower()
                    or ql in r.get('area','').lower() or ql in r.get('direccion','').lower()
                    or any(ql in t.lower() for t in r.get('tags',[]))]
    if direccion:
        reportes = [r for r in reportes if direccion.lower() in r.get('direccion','').lower()]
    if area:
        reportes = [r for r in reportes if area.lower() in r.get('area','').lower()]
    if estado:
        reportes = [r for r in reportes if r.get('estado') == estado]
    if tags:
        tl = [t.strip().lower() for t in tags.split(',')]
        reportes = [r for r in reportes if any(t in [x.lower() for x in r.get('tags',[])] for t in tl)]
    return reportes

# ── Areas ────────────────────────────────────────────────────────
def get_all_areas() -> List[Dict]:
    conn = get_db()
    rows = conn.execute("SELECT id, data FROM areas ORDER BY json_extract(data, '$.nombre')").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = json.loads(r['data'])
        d['id'] = r['id']
        result.append(d)
    return result

def get_area(area_id: str) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT id, data FROM areas WHERE id = ?", (area_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = json.loads(row['data'])
    d['id'] = row['id']
    return d

def create_area(area: Dict) -> Dict:
    conn = get_db()
    area_id = area['id']
    existing = conn.execute("SELECT id FROM areas WHERE id = ?", (area_id,)).fetchone()
    if existing:
        counter = 2
        while conn.execute("SELECT id FROM areas WHERE id = ?", (f"{area_id}-{counter}",)).fetchone():
            counter += 1
        area_id = f"{area_id}-{counter}"
    area['id'] = area_id
    conn.execute("INSERT INTO areas (id, data) VALUES (?, ?)", (area_id, json.dumps(area, ensure_ascii=False)))
    conn.commit()
    conn.close()
    return area

def update_area(area_id: str, updates: Dict) -> Optional[Dict]:
    conn = get_db()
    row = conn.execute("SELECT data FROM areas WHERE id = ?", (area_id,)).fetchone()
    if not row:
        conn.close()
        return None
    current = json.loads(row['data'])
    current.update(updates)
    current['id'] = area_id
    conn.execute("UPDATE areas SET data = ? WHERE id = ?", (json.dumps(current, ensure_ascii=False), area_id))
    conn.commit()
    conn.close()
    return current

def delete_area(area_id: str) -> bool:
    conn = get_db()
    cursor = conn.execute("DELETE FROM areas WHERE id = ?", (area_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def get_stats() -> Dict:
    reportes = get_all_reportes()
    areas = get_all_areas()
    by_dir = {}
    by_est = {}
    for r in reportes:
        d = r.get('direccion', 'Sin dirección')
        by_dir[d] = by_dir.get(d, 0) + 1
        e = r.get('estado', 'activo')
        by_est[e] = by_est.get(e, 0) + 1
    return {"total_reportes": len(reportes), "total_areas": len(areas), "by_direccion": by_dir, "by_estado": by_est}

# ── Notifications ─────────────────────────────────────────────────
def create_notification(user_id: int, type: str, title: str, message: str, reporte_id: str = None, actor_id: int = None):
    conn = get_db()
    conn.execute(
        "INSERT INTO notifications (user_id, actor_id, type, title, message, reporte_id) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, actor_id, type, title, message, reporte_id)
    )
    conn.commit()
    conn.close()

def notify_all_admins(type: str, title: str, message: str, reporte_id: str = None, actor_id: int = None, exclude_user_id: int = None):
    """Send notification to all admin users (optionally excluding someone)."""
    conn = get_db()
    admins = conn.execute("SELECT id FROM users WHERE role = 'admin' AND is_active = 1").fetchall()
    for admin in admins:
        if exclude_user_id and admin['id'] == exclude_user_id:
            continue
        conn.execute(
            "INSERT INTO notifications (user_id, actor_id, type, title, message, reporte_id) VALUES (?, ?, ?, ?, ?, ?)",
            (admin['id'], actor_id, type, title, message, reporte_id)
        )
    conn.commit()
    conn.close()

def get_notifications(user_id: int, limit: int = 50) -> List[Dict]:
    conn = get_db()
    rows = conn.execute("""
        SELECT n.*, u.name as actor_name, u.email as actor_email, u.role as actor_role
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC LIMIT ?
    """, (user_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_unread_count(user_id: int) -> int:
    conn = get_db()
    row = conn.execute(
        "SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0",
        (user_id,)
    ).fetchone()
    conn.close()
    return row['c']

def mark_notification_read(notif_id: int, user_id: int) -> bool:
    conn = get_db()
    cursor = conn.execute(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        (notif_id, user_id)
    )
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

def mark_all_notifications_read(user_id: int):
    conn = get_db()
    conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", (user_id,))
    conn.commit()
    conn.close()

# ── Audit Log ────────────────────────────────────────────────────
def log_action(user_id: int, action: str, target_type: str = None, target_id: str = None, details: str = None):
    conn = get_db()
    conn.execute(
        "INSERT INTO audit_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
        (user_id, action, target_type, target_id, details)
    )
    conn.commit()
    conn.close()

def get_audit_log(limit: int = 50) -> List[Dict]:
    conn = get_db()
    rows = conn.execute("""
        SELECT a.*, u.name as user_name, u.email as user_email
        FROM audit_log a LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Migration from JSON files ────────────────────────────────────
def migrate_from_json():
    """Import existing JSON data into SQLite. Safe to run multiple times."""
    conn = get_db()
    
    # Migrate reportes
    reportes_file = DATA_DIR / "reportes.json"
    if reportes_file.exists():
        with open(reportes_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for r in data.get('reportes', []):
            rid = r.get('id', '')
            existing = conn.execute("SELECT id FROM reportes WHERE id = ?", (rid,)).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO reportes (id, data) VALUES (?, ?)",
                    (rid, json.dumps(r, ensure_ascii=False))
                )
    
    # Migrate areas
    areas_file = DATA_DIR / "areas.json"
    if areas_file.exists():
        with open(areas_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for a in data.get('areas', []):
            aid = a.get('id', '')
            existing = conn.execute("SELECT id FROM areas WHERE id = ?", (aid,)).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO areas (id, data) VALUES (?, ?)",
                    (aid, json.dumps(a, ensure_ascii=False))
                )
    
    conn.commit()
    conn.close()

def sync_areas_from_json():
    """Replace DB areas with the committed JSON seed file when present."""
    areas_file = DATA_DIR / "areas.json"
    if not areas_file.exists():
        return

    with open(areas_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    areas = data.get('areas', [])
    conn = get_db()
    conn.execute("DELETE FROM areas")
    for area in areas:
        aid = area.get('id', '')
        if not aid:
            continue
        conn.execute(
            "INSERT INTO areas (id, data) VALUES (?, ?)",
            (aid, json.dumps(area, ensure_ascii=False))
        )
    conn.commit()
    conn.close()

def ensure_admin_exists():
    """Create default admin user if no users exist."""
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()['c']
    conn.close()
    if count == 0:
        default_pw = os.environ.get("ADMIN_DEFAULT_PASSWORD", "admin123")
        default_email = os.environ.get("ADMIN_DEFAULT_EMAIL", "admin@nadro.com")
        create_user(default_email, default_pw, 'Administrador', 'admin')
        print(f"✓ Usuario admin creado: {default_email}")

def bootstrap():
    """Initialize everything."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    init_db()
    migrate_from_json()
    sync_areas_from_json()
    ensure_admin_exists()
