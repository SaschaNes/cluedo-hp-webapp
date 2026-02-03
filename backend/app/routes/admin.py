from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Role
from ..security import hash_password, get_session_user_id

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(req: Request, db: Session) -> User:
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")
    user = db.query(User).filter(User.id == uid).first()
    if not user or user.role != Role.admin.value:
        raise HTTPException(status_code=403, detail="forbidden")
    return user

@router.get("/users")
def list_users(req: Request, db: Session = Depends(get_db)):
    require_admin(req, db)
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "disabled": u.disabled} for u in users]

@router.post("/users")
def create_user(req: Request, data: dict, db: Session = Depends(get_db)):
    require_admin(req, db)
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    if not email or not password:
        raise HTTPException(400, "email/password required")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "email exists")
    role = data.get("role") or Role.user.value
    if role not in (Role.admin.value, Role.user.value):
        raise HTTPException(400, "invalid role")
    u = User(email=email, password_hash=hash_password(password), role=role)
    db.add(u); db.commit()
    return {"ok": True, "id": u.id}
    