import hashlib, random
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Game, Entry, SheetState, Category, GameMember, User, Role
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


CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def gen_code(n=6) -> str:
    return "".join(random.choice(CODE_ALPHABET) for _ in range(n))


def ensure_member(db: Session, game_id: str, user_id: str):
    ex = db.query(GameMember).filter(GameMember.game_id == game_id, GameMember.user_id == user_id).first()
    if ex:
        return
    db.add(GameMember(game_id=game_id, user_id=user_id))
    db.commit()


def require_game_member(db: Session, game_id: str, user_id: str) -> Game:
    g = db.query(Game).filter(Game.id == game_id).first()
    if not g:
        raise HTTPException(404, "game not found")

    mem = db.query(GameMember).filter(GameMember.game_id == game_id, GameMember.user_id == user_id).first()
    if not mem:
        raise HTTPException(403, "not a member of this game")
    return g


@router.post("")
def create_game(req: Request, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)

    name = data.get("name") or "Neues Spiel"
    seed = random.randint(1, 2_000_000_000)

    # unique code
    code = gen_code()
    while db.query(Game).filter(Game.code == code).first():
        code = gen_code()

    g = Game(host_user_id=uid, name=name, seed=seed, code=code, winner_user_id=None)
    db.add(g)
    db.commit()

    # creator joins automatically
    ensure_member(db, g.id, uid)

    return {"id": g.id, "name": g.name, "code": g.code, "host_user_id": g.host_user_id}


@router.post("/join")
def join_game(req: Request, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    code = (data.get("code") or "").strip().upper()
    if not code:
        raise HTTPException(400, "code required")

    g = db.query(Game).filter(Game.code == code).first()
    if not g:
        raise HTTPException(404, "game not found")

    ensure_member(db, g.id, uid)
    return {"ok": True, "id": g.id, "name": g.name, "code": g.code, "host_user_id": g.host_user_id}


@router.get("")
def list_games(req: Request, db: Session = Depends(get_db)):
    uid = require_user(req, db)

    # list games where user is member
    q = (
        db.query(Game)
        .join(GameMember, GameMember.game_id == Game.id)
        .filter(GameMember.user_id == uid)
        .order_by(Game.created_at.desc())
    )
    games = q.all()

    # winner email (optional)
    out = []
    for g in games:
        winner_email = None
        if g.winner_user_id:
            wu = db.query(User).filter(User.id == g.winner_user_id).first()
            winner_email = wu.email if wu else None
        out.append(
            {
                "id": g.id,
                "name": g.name,
                "seed": g.seed,
                "code": g.code,
                "host_user_id": g.host_user_id,
                "winner_user_id": g.winner_user_id,
                "winner_email": winner_email,
            }
        )
    return out


@router.get("/{game_id}")
def get_game_meta(req: Request, game_id: str, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    g = require_game_member(db, game_id, uid)

    winner_email = None
    if g.winner_user_id:
        wu = db.query(User).filter(User.id == g.winner_user_id).first()
        winner_email = wu.email if wu else None

    return {
        "id": g.id,
        "name": g.name,
        "code": g.code,
        "host_user_id": g.host_user_id,
        "winner_user_id": g.winner_user_id,
        "winner_email": winner_email,
    }


@router.get("/{game_id}/members")
def list_members(req: Request, game_id: str, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    _g = require_game_member(db, game_id, uid)

    # return only "user" role (admin excluded)
    members = (
        db.query(User)
        .join(GameMember, GameMember.user_id == User.id)
        .filter(GameMember.game_id == game_id, User.role == Role.user.value, User.disabled == False)
        .order_by(User.email.asc())
        .all()
    )
    return [{"id": u.id, "email": u.email} for u in members]


@router.patch("/{game_id}/winner")
def set_winner(req: Request, game_id: str, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    g = require_game_member(db, game_id, uid)

    # only host can set winner
    if g.host_user_id != uid:
        raise HTTPException(403, "only host can set winner")

    winner_user_id = data.get("winner_user_id")
    if winner_user_id is None:
        g.winner_user_id = None
        db.add(g)
        db.commit()
        return {"ok": True, "winner_user_id": None}

    # must be a member AND role=user
    member = db.query(GameMember).filter(GameMember.game_id == game_id, GameMember.user_id == winner_user_id).first()
    if not member:
        raise HTTPException(400, "winner must be a member of the game")

    u = db.query(User).filter(User.id == winner_user_id).first()
    if not u or u.role != Role.user.value or u.disabled:
        raise HTTPException(400, "invalid winner")

    g.winner_user_id = winner_user_id
    db.add(g)
    db.commit()
    return {"ok": True, "winner_user_id": g.winner_user_id}


@router.get("/{game_id}/sheet")
def get_sheet(req: Request, game_id: str, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    g = require_game_member(db, game_id, uid)

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
            "chip": st.chip if st else None,  # NEW
            "order": stable_order(g.seed, uid, e.id),
        }
        out[e.category].append(item)

    for k in out:
        out[k].sort(key=lambda x: x["order"])
        for i in out[k]:
            del i["order"]

    return out


@router.patch("/{game_id}/sheet/{entry_id}")
def patch_sheet(req: Request, game_id: str, entry_id: str, data: dict, db: Session = Depends(get_db)):
    uid = require_user(req, db)
    g = require_game_member(db, game_id, uid)

    status = data.get("status")
    note_tag = data.get("note_tag")
    chip = data.get("chip")

    if note_tag not in (None, "i", "m", "s"):
        raise HTTPException(400, "invalid note_tag")
    if status is not None and status not in (0, 1, 2, 3):
        raise HTTPException(400, "invalid status")

    if chip is not None:
        chip = (chip or "").strip().upper()
        if chip == "":
            chip = None
        if chip is not None:
            if len(chip) > 8:
                raise HTTPException(400, "invalid chip")

    st = (
        db.query(SheetState)
        .filter(
            SheetState.game_id == g.id,
            SheetState.owner_user_id == uid,
            SheetState.entry_id == entry_id,
        )
        .first()
    )

    if not st:
        st = SheetState(game_id=g.id, owner_user_id=uid, entry_id=entry_id, status=0, note_tag=None, chip=None)
        db.add(st)

    if status is not None:
        st.status = status
    if "note_tag" in data:
        st.note_tag = note_tag

        # wenn note_tag zurück auf null -> chip auch löschen
        if note_tag is None:
            st.chip = None

    # chip nur speichern wenn note_tag "s" ist (ansonsten löschen wir es)
    if "chip" in data:
        if st.note_tag == "s":
            st.chip = chip
        else:
            st.chip = None

    db.commit()
    return {"ok": True}
    