import hashlib
import random
import string
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Game, GameMember, Entry, SheetState, Category, User, Role
from ..security import get_session_user_id

router = APIRouter(prefix="/games", tags=["games"])

def require_user(req: Request, db: Session) -> str:
    uid = get_session_user_id(req)
    if not uid:
        raise HTTPException(status_code=401, detail="not logged in")
    return uid

def stable_order(seed: int, user_id: str, entry_id: str) -> str:
    s = f"{seed}:{user_id}:{entry_id}".encode()
    return hashlib.sha256(s).hexdigest()

def _rand_join_code(n: int = 6) -> str:
    return "".join(random.choice(string.digits) for _ in range(n))

def _new_unique_join_code(db: Session) -> str:
    for _ in range(50):
        code = _rand_join_code()
        if not db.query(Game).filter(Game.join_code == code).first():
            return code
    raise HTTPException(500, "failed to generate join code")

def require_member(req: Request, db: Session, game_id: str) -> tuple[str, Game]:
    uid = require_user(req, db)
    g = db.query(Game).filter(Game.id == game_id).first()
    if not g:
        raise HTTPException(404, "game not found")
    m = db.query(GameMember).filter(GameMember.game_id == g.id, GameMember.user_id == uid).first()
    if not m:
        raise HTTPException(403, "not a member of this game")
    return uid, g

@router.post("")
def create_game(req: Request, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    name = data.get("name") or "Neues Spiel"
    seed = random.randint(1, 2_000_000_000)
    join_code = _new_unique_join_code(db)

    g = Game(owner_user_id=uid, name=name, seed=seed, join_code=join_code)
    db.add(g)
    db.commit()

    # creator becomes member
    db.add(GameMember(game_id=g.id, user_id=uid))
    db.commit()

    return {"id": g.id, "name": g.name, "join_code": g.join_code}

@router.post("/join")
def join_game(req: Request, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    code = (data.get("code") or "").strip()
    if not code or len(code) < 4:
        raise HTTPException(400, "code required")

    g = db.query(Game).filter(Game.join_code == code).first()
    if not g:
        raise HTTPException(404, "game not found")

    exists = db.query(GameMember).filter(GameMember.game_id == g.id, GameMember.user_id == uid).first()
    if not exists:
        db.add(GameMember(game_id=g.id, user_id=uid))
        db.commit()

    return {"ok": True, "game": {"id": g.id, "name": g.name, "join_code": g.join_code}}

@router.get("")
def list_games(req: Request, db: Session = Depends(get_db)):
    uid = require_user(req, db)

    games = (
        db.query(Game)
        .join(GameMember, GameMember.game_id == Game.id)
        .filter(GameMember.user_id == uid)
        .order_by(Game.created_at.desc())
        .all()
    )

    out = []
    for g in games:
        winner = None
        if g.winner_user_id:
            wu = db.query(User).filter(User.id == g.winner_user_id).first()
            if wu:
                winner = {"id": wu.id, "email": wu.email}
        out.append({"id": g.id, "name": g.name, "seed": g.seed, "join_code": g.join_code, "winner": winner})
    return out

@router.get("/{game_id}/meta")
def game_meta(req: Request, game_id: str, db: Session = Depends(get_db)):
    uid, g = require_member(req, db, game_id)

    winner = None
    if g.winner_user_id:
        wu = db.query(User).filter(User.id == g.winner_user_id).first()
        if wu:
            winner = {"id": wu.id, "email": wu.email}
    return {"id": g.id, "name": g.name, "join_code": g.join_code, "winner": winner}

@router.get("/{game_id}/players")
def list_players(req: Request, game_id: str, db: Session = Depends(get_db)):
    _uid, g = require_member(req, db, game_id)

    # only non-admin users (admin doesn't play)
    players = (
        db.query(User)
        .join(GameMember, GameMember.user_id == User.id)
        .filter(GameMember.game_id == g.id, User.disabled == False, User.role == Role.user.value)  # noqa: E712
        .order_by(User.email.asc())
        .all()
    )
    return [{"id": u.id, "email": u.email} for u in players]

@router.patch("/{game_id}/winner")
def set_winner(req: Request, game_id: str, data: dict, db: Session = Depends(get_db)):
    _uid, g = require_member(req, db, game_id)

    winner_user_id = data.get("winner_user_id")
    if winner_user_id is not None:
        # must be a member + non-admin
        u = db.query(User).filter(User.id == winner_user_id, User.disabled == False).first()  # noqa: E712
        if not u or u.role != Role.user.value:
            raise HTTPException(400, "invalid winner_user_id")

        member = db.query(GameMember).filter(GameMember.game_id == g.id, GameMember.user_id == u.id).first()
        if not member:
            raise HTTPException(400, "winner is not in this game")

    g.winner_user_id = winner_user_id
    db.add(g)
    db.commit()

    return {"ok": True, "winner_user_id": g.winner_user_id}

@router.get("/{game_id}/sheet")
def get_sheet(req: Request, game_id: str, db: Session = Depends(get_db)):
    uid, g = require_member(req, db, game_id)

    entries = db.query(Entry).all()
    states = (
        db.query(SheetState)
        .filter(SheetState.game_id == g.id, SheetState.owner_user_id == uid)
        .all()
    )
    state_map = {st.entry_id: st for st in states}

    out = {"suspect": [], "item": [], "location": []}
    for e in entries:
        st = state_map.get(e.id)
        item = {
            "entry_id": e.id,
            "label": e.label,
            "status": st.status if st else 0,
            "note_tag": st.note_tag if st else None,
            "chip_code": st.chip_code if st else None,
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
    uid, g = require_member(req, db, game_id)

    status = data.get("status")
    note_tag = data.get("note_tag")
    chip_code = data.get("chip_code")

    if note_tag not in (None, "i", "m", "s"):
        raise HTTPException(400, "invalid note_tag")
    if status is not None and status not in (0, 1, 2, 3):
        raise HTTPException(400, "invalid status")

    # chip_code only allowed if note_tag == 's' (or if note_tag not provided but current is 's')
    if chip_code is not None:
        if not isinstance(chip_code, str) or len(chip_code) > 16:
            raise HTTPException(400, "invalid chip_code")

    st = db.query(SheetState).filter(
        SheetState.game_id == g.id,
        SheetState.owner_user_id == uid,
        SheetState.entry_id == entry_id
    ).first()

    if not st:
        st = SheetState(game_id=g.id, owner_user_id=uid, entry_id=entry_id, status=0, note_tag=None, chip_code=None)
        db.add(st)

    if status is not None:
        st.status = status

    if "note_tag" in data:
        st.note_tag = note_tag
        # if leaving 's', clear chip
        if note_tag != "s":
            st.chip_code = None

    if "chip_code" in data:
        # chip_code is only meaningful when note_tag is 's'
        effective_tag = st.note_tag
        if effective_tag != "s":
            raise HTTPException(400, "chip_code requires note_tag 's'")
        st.chip_code = chip_code

    db.commit()
    return {"ok": True}
    