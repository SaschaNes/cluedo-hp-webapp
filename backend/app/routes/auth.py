from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..security import verify_password, make_session_value, set_session, clear_session, get_session_user_id

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(data: dict, resp: Response, db: Session = Depends(get_db)):
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    user = db.query(User).filter(User.email == email, User.disabled == False).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")
    set_session(resp, make_session_value(user.id))
    return {"ok": True, "role": user.role, "email": user.email}

@router.post("/logout")
def logout(resp: Response):
    clear_session(resp)
    return {"ok": True}

@router.get("/me")
def me(req: Request, db: Session = Depends(get_db)):
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="not logged in")
    return {"id": user.id, "email": user.email, "role": user.role}
    