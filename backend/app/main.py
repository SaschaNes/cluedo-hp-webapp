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


def _has_column(db: Session, table: str, col: str) -> bool:
    """
SQLite + Postgres friendly check.
We use a pragma first (SQLite), fallback to information_schema.
    """
    try:
        rows = db.execute(text(f"PRAGMA table_info({table})")).all()
        return any(r[1] == col for r in rows)  # pragma: column name is at index 1
    except Exception:
        db.rollback()

    try:
        rows = db.execute(
            text(
                """
SELECT column_name
FROM information_schema.columns
WHERE table_name = :t AND column_name = :c
                """
            ),
            {"t": table, "c": col},
        ).all()
        return len(rows) > 0
    except Exception:
        db.rollback()
        return False


def _auto_migrate(db: Session):
    """
Very small, pragmatic auto-migration (no alembic).
- creates missing tables via create_all
- adds missing columns via ALTER TABLE (best effort)
- supports old schema (join_code/chip_code) and new schema (code/chip)
"""

    # --- users.theme_key ---
    if not _has_column(db, "users", "theme_key"):
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN theme_key VARCHAR DEFAULT 'default'"))
            db.commit()
        except Exception:
            db.rollback()

    # --- games: code / join_code + winner_user_id + host_user_id (optional) ---
    # We support both column names:
    # old: join_code
    # new: code
    has_join_code = _has_column(db, "games", "join_code")
    has_code = _has_column(db, "games", "code")

    # If neither exists, create "code" (new preferred)
    if not has_join_code and not has_code:
        try:
            db.execute(text("ALTER TABLE games ADD COLUMN code VARCHAR"))
            db.commit()
            has_code = True
        except Exception:
            db.rollback()

    # If only join_code exists but your code now expects "code",
    # add "code" too and later mirror values.
    if has_join_code and not has_code:
        try:
            db.execute(text("ALTER TABLE games ADD COLUMN code VARCHAR"))
            db.commit()
            has_code = True
        except Exception:
            db.rollback()

    # winner_user_id
    if not _has_column(db, "games", "winner_user_id"):
        try:
            db.execute(text("ALTER TABLE games ADD COLUMN winner_user_id VARCHAR"))
            db.commit()
        except Exception:
            db.rollback()

    # host_user_id (nice to have for "only host can set winner")
    if not _has_column(db, "games", "host_user_id"):
        try:
            db.execute(text("ALTER TABLE games ADD COLUMN host_user_id VARCHAR"))
            db.commit()
        except Exception:
            db.rollback()

    # --- sheet_state chip / chip_code ---
    has_chip_code = _has_column(db, "sheet_state", "chip_code")
    has_chip = _has_column(db, "sheet_state", "chip")

    if not has_chip_code and not has_chip:
        # prefer "chip"
        try:
            db.execute(text("ALTER TABLE sheet_state ADD COLUMN chip VARCHAR"))
            db.commit()
            has_chip = True
        except Exception:
            db.rollback()

    # if old chip_code exists but new expects chip -> add chip and mirror later
    if has_chip_code and not has_chip:
        try:
            db.execute(text("ALTER TABLE sheet_state ADD COLUMN chip VARCHAR"))
            db.commit()
            has_chip = True
        except Exception:
            db.rollback()

    # --- indexes for game code ---
    # We create unique index for the column(s) that exist.
    try:
        if has_join_code:
            db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_games_join_code ON games (join_code)"))
        if has_code:
            db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_games_code ON games (code)"))
        db.commit()
    except Exception:
        db.rollback()

    # --- backfill code values ---
    # 1) if join_code exists and code exists, ensure code mirrors join_code where missing
    if has_join_code and has_code:
        try:
            db.execute(text("UPDATE games SET code = join_code WHERE (code IS NULL OR code = '') AND join_code IS NOT NULL AND join_code <> ''"))
            db.commit()
        except Exception:
            db.rollback()

    # 2) generate missing codes in whichever column we have
    # Prefer writing into "code" (new), but also keep join_code in sync if present.
    code_col = "code" if has_code else "join_code" if has_join_code else None
    if code_col:
        try:
            missing = db.execute(
                text(f"SELECT id FROM games WHERE {code_col} IS NULL OR {code_col} = ''")
            ).all()
        except Exception:
            db.rollback()
            missing = []

        if missing:
            try:
                used_rows = db.execute(text(f"SELECT {code_col} FROM games WHERE {code_col} IS NOT NULL")).all()
                used = set([r[0] for r in used_rows if r and r[0]])
            except Exception:
                db.rollback()
                used = set()

            for (gid,) in missing:
                code = _rand_join_code()
                while code in used:
                    code = _rand_join_code()
                used.add(code)

                try:
                    # write into main col
                    db.execute(text(f"UPDATE games SET {code_col} = :c WHERE id = :id"), {"c": code, "id": gid})
                    # keep both in sync if both exist
                    if has_join_code and code_col == "code":
                        db.execute(text("UPDATE games SET join_code = :c WHERE id = :id AND (join_code IS NULL OR join_code = '')"), {"c": code, "id": gid})
                    if has_code and code_col == "join_code":
                        db.execute(text("UPDATE games SET code = :c WHERE id = :id AND (code IS NULL OR code = '')"), {"c": code, "id": gid})
                    db.commit()
                except Exception:
                    db.rollback()

    # --- backfill host_user_id: default to owner_user_id ---
    try:
        if _has_column(db, "games", "host_user_id"):
            db.execute(text("UPDATE games SET host_user_id = owner_user_id WHERE host_user_id IS NULL OR host_user_id = ''"))
            db.commit()
    except Exception:
        db.rollback()

    # --- backfill membership: ensure owner is member ---
    # uses ORM; only relies on existing table GameMember (create_all already ran)
    try:
        all_games = db.query(Game).all()
        for g in all_games:
            exists = (
                db.query(GameMember)
                .filter(GameMember.game_id == g.id, GameMember.user_id == g.owner_user_id)
                .first()
            )
            if not exists:
                db.add(GameMember(game_id=g.id, user_id=g.owner_user_id))
        db.commit()
    except Exception:
        db.rollback()

    # --- mirror chip_code -> chip if both exist and chip empty ---
    if has_chip_code and has_chip:
        try:
            db.execute(text("UPDATE sheet_state SET chip = chip_code WHERE (chip IS NULL OR chip = '') AND chip_code IS NOT NULL AND chip_code <> ''"))
            db.commit()
        except Exception:
            db.rollback()


def seed_entries(db: Session):
    if db.query(Entry).count() > 0:
        return
    suspects = ["Draco Malfoy", "Crabbe & Goyle", "Lucius Malfoy", "Dolores Umbridge", "Peter Pettigrew", "Bellatrix Lestrange"]
    items = ["Schlaftrunk", "Verschwindekabinett", "Portschlüssel", "Impedimenta", "Petrificus Totalus", "Alraune"]
    locations = ["Große Halle", "Krankenflügel", "Raum der Wünsche", "Klassenzimmer für Zaubertränke", "Pokalszimmer", "Klassenzimmer für Wahrsagen", "Eulerei", "Bibliothek", "Verteidigung gegen die dunklen Künste"]

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
        