import os
import random
import string

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import Base, engine, SessionLocal
from .models import User, Entry, Category, Role, Game, GameMember
from .security import hash_password
from .routes.auth import router as auth_router
from .routes.admin import router as admin_router
from .routes.games import router as games_router

app = FastAPI(title="Cluedo Sheet")

# Intern: Frontend läuft auf :8081
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(games_router)

def _rand_join_code(n: int = 6) -> str:
    # digits only (kahoot style)
    return "".join(random.choice(string.digits) for _ in range(n))

def _auto_migrate(db: Session):
    """
Very small, pragmatic auto-migration (no alembic).
- creates missing tables via create_all
- adds missing columns via ALTER TABLE (best effort)
    """
    # Users.theme_key
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN theme_key VARCHAR DEFAULT 'default'"))
        db.commit()
    except Exception:
        db.rollback()

    # Games.join_code + winner_user_id
    try:
        db.execute(text("ALTER TABLE games ADD COLUMN join_code VARCHAR"))
        db.commit()
    except Exception:
        db.rollback()

    try:
        db.execute(text("ALTER TABLE games ADD COLUMN winner_user_id VARCHAR"))
        db.commit()
    except Exception:
        db.rollback()

    # SheetState.chip_code
    try:
        db.execute(text("ALTER TABLE sheet_state ADD COLUMN chip_code VARCHAR"))
        db.commit()
    except Exception:
        db.rollback()

    # Ensure unique index for join_code (best effort)
    try:
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_games_join_code ON games (join_code)"))
        db.commit()
    except Exception:
        db.rollback()

    # Backfill join_code for existing games
    games = db.query(Game).filter((Game.join_code == None) | (Game.join_code == "")).all()  # noqa: E711
    if games:
        used = set([r[0] for r in db.execute(text("SELECT join_code FROM games WHERE join_code IS NOT NULL")).all() if r[0]])
        for g in games:
            code = _rand_join_code()
            while code in used:
                code = _rand_join_code()
            g.join_code = code
            used.add(code)
        db.commit()

    # Backfill membership: ensure owner is member
    all_games = db.query(Game).all()
    for g in all_games:
        exists = db.query(GameMember).filter(GameMember.game_id == g.id, GameMember.user_id == g.owner_user_id).first()
        if not exists:
            db.add(GameMember(game_id=g.id, user_id=g.owner_user_id))
    db.commit()

def seed_entries(db: Session):
    if db.query(Entry).count() > 0:
        return
    suspects = ["Draco Malfoy","Crabbe & Goyle","Lucius Malfoy","Dolores Umbridge","Peter Pettigrew","Bellatrix Lestrange"]
    items = ["Schlaftrunk","Verschwindekabinett","Portschlüssel","Impedimenta","Petrificus Totalus","Alraune"]
    locations = ["Große Halle","Krankenflügel","Raum der Wünsche","Klassenzimmer für Zaubertränke","Pokalszimmer","Klassenzimmer für Wahrsagen","Eulerei","Bibliothek","Verteidigung gegen die dunklen Künste"]

    for s in suspects:
        db.add(Entry(category=Category.suspect.value, label=s))
    for i in items:
        db.add(Entry(category=Category.item.value, label=i))
    for l in locations:
        db.add(Entry(category=Category.location.value, label=l))
    db.commit()

def ensure_admin(db: Session):
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@local").lower().strip()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "ChangeMeNow123!")
    u = db.query(User).filter(User.email == admin_email).first()
    if not u:
        db.add(
            User(
                email=admin_email,
                password_hash=hash_password(admin_pw),
                role=Role.admin.value,
                theme_key="default",
            )
        )
        db.commit()

@app.on_event("startup")
def on_startup():
    # create new tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        _auto_migrate(db)
        ensure_admin(db)
        seed_entries(db)
    finally:
        db.close()
        