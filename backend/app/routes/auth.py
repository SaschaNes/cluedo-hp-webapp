from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..security import (
    verify_password,
    make_session_value,
    set_session,
    clear_session,
    get_session_user_id,
    hash_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(data: dict, resp: Response, db: Session = Depends(get_db)):
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    user = db.query(User).filter(User.email == email, User.disabled == False).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")

    set_session(resp, make_session_value(user.id))
    return {"ok": True, "role": user.role, "email": user.email, "theme_key": user.theme_key}


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
    return {"id": user.id, "email": user.email, "role": user.role, "display_name": user.display_name}
    

@router.get("/me/stats")
def my_stats(req: Request, db: Session = Depends(get_db)):
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")

    # "played" = games where user is member AND winner is set (finished games)
    from sqlalchemy import func
    from ..models import Game, GameMember

    played = (
        db.query(func.count(Game.id))
        .join(GameMember, GameMember.game_id == Game.id)
        .filter(GameMember.user_id == uid, Game.winner_user_id != None)
        .scalar()
        or 0
    )

    wins = (
        db.query(func.count(Game.id))
        .join(GameMember, GameMember.game_id == Game.id)
        .filter(GameMember.user_id == uid, Game.winner_user_id == uid)
        .scalar()
        or 0
    )

    losses = max(int(played) - int(wins), 0)
    winrate = (float(wins) / float(played) * 100.0) if played else 0.0

    return {
        "played": int(played),
        "wins": int(wins),
        "losses": int(losses),
        "winrate": round(winrate, 1),
    }

@router.patch("/password")
def set_password(data: dict, req: Request, db: Session = Depends(get_db)):
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")

    password = data.get("password") or ""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="password too short (min 8)")

    user = db.query(User).filter(User.id == uid, User.disabled == False).first()
    if not user:
        raise HTTPException(status_code=401, detail="not logged in")

    user.password_hash = hash_password(password)
    db.add(user)
    db.commit()
    return {"ok": True}


@router.patch("/theme")
def set_theme(data: dict, req: Request, db: Session = Depends(get_db)):
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")

    theme_key = (data.get("theme_key") or "").strip()
    if not theme_key:
        raise HTTPException(status_code=400, detail="theme_key required")

    user = db.query(User).filter(User.id == uid, User.disabled == False).first()
    if not user:
        raise HTTPException(status_code=401, detail="not logged in")

    user.theme_key = theme_key
    db.add(user)
    db.commit()

    return {"ok": True, "theme_key": user.theme_key}
    