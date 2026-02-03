import hashlib, random
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Game, Entry, SheetState, Category
from ..security import get_session_user_id

router = APIRouter(prefix="/games", tags=["games"])

def require_user(req: Request, db: Session):
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")
    return uid

def stable_order(seed: int, user_id: str, entry_id: str) -> str:
    s = f"{seed}:{user_id}:{entry_id}".encode()
    return hashlib.sha256(s).hexdigest()

@router.post("")
def create_game(req: Request, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    name = data.get("name") or "Neues Spiel"
    seed = random.randint(1, 2_000_000_000)
    g = Game(owner_user_id=uid, name=name, seed=seed)
    db.add(g); db.commit()
    return {"id": g.id, "name": g.name}

@router.get("")
def list_games(req: Request, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    games = db.query(Game).filter(Game.owner_user_id == uid).order_by(Game.created_at.desc()).all()
    return [{"id": g.id, "name": g.name, "seed": g.seed} for g in games]

@router.get("/{game_id}/sheet")
def get_sheet(req: Request, game_id: str, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    g = db.query(Game).filter(Game.id == game_id, Game.owner_user_id == uid).first()
    if not g:
        raise HTTPException(404, "game not found")

    entries = db.query(Entry).all()
    states = db.query(SheetState).filter(SheetState.game_id == g.id, SheetState.owner_user_id == uid).all()
    state_map = {st.entry_id: st for st in states}

    out = {"suspect": [], "item": [], "location": []}
    for e in entries:
        st = state_map.get(e.id)
        item = {
            "entry_id": e.id,
            "label": e.label,
            "status": st.status if st else 0,
            "note_tag": st.note_tag if st else None,
            "order": stable_order(g.seed, uid, e.id),
        }
        out[e.category].append(item)

    # sort within category
    for k in out:
        out[k].sort(key=lambda x: x["order"])
        for i in out[k]:
            del i["order"]

    return out

@router.patch("/{game_id}/sheet/{entry_id}")
def patch_sheet(req: Request, game_id: str, entry_id: str, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    g = db.query(Game).filter(Game.id == game_id, Game.owner_user_id == uid).first()
    if not g:
        raise HTTPException(404, "game not found")

    status = data.get("status")
    note_tag = data.get("note_tag")

    if note_tag not in (None, "i", "m", "s"):
        raise HTTPException(400, "invalid note_tag")
    if status is not None and status not in (0, 1, 2, 3):
        raise HTTPException(400, "invalid status")

    st = db.query(SheetState).filter(
        SheetState.game_id == g.id,
        SheetState.owner_user_id == uid,
        SheetState.entry_id == entry_id
    ).first()

    if not st:
        st = SheetState(game_id=g.id, owner_user_id=uid, entry_id=entry_id, status=0, note_tag=None)
        db.add(st)

    if status is not None:
        st.status = status
    if "note_tag" in data:
        st.note_tag = note_tag

    db.commit()
    return {"ok": True}
    