"""
auth.py — JWT authentication for PBI Docs.
"""
import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from fastapi import HTTPException, Depends, Request

from app.database import get_user_by_id, get_user_by_email, verify_password, update_last_login

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "CRITICAL: SECRET_KEY environment variable not set. "
        "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12

security = HTTPBearer(auto_error=False)

def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[Dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        payload["sub"] = int(payload["sub"])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    user = get_user_by_email(email)
    if not user or not user.get('is_active'):
        return None
    if not verify_password(password, user['password_hash']):
        return None
    update_last_login(user['id'])
    return user

async def get_current_user(request: Request) -> Dict:
    # Try httpOnly cookie first (production method)
    token = request.cookies.get("auth_token")

    # Fallback to Authorization header (dev/API clients)
    if not token and request.headers.get("authorization"):
        try:
            auth_header = request.headers.get("authorization")
            token = auth_header.replace("Bearer ", "")
        except:
            pass

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = get_user_by_id(payload["sub"])
    if not user or not user.get('is_active'):
        raise HTTPException(status_code=401, detail="User not found or disabled")

    return {"id": user['id'], "email": user['email'], "name": user['name'], "role": user['role']}

async def require_admin(user: Dict = Depends(get_current_user)) -> Dict:
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Se requiere rol de administrador")
    return user