import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import Base, engine, SessionLocal
from .models import User, Entry, Category, Role
from .security import hash_password
from .routes.auth import router as auth_router
from .routes.admin import router as admin_router
from .routes.games import router as games_router

app = FastAPI(title="Cluedo Sheet")

# Intern: Frontend läuft auf :8081
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://127.0.0.1:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(games_router)

def seed_entries(db: Session):
    # Du kannst hier deine HP-Edition Einträge reinschreiben.
    # (Für rein private Nutzung ok – öffentlich würde ich’s generisch machen.)
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
        db.add(User(email=admin_email, password_hash=hash_password(admin_pw), role=Role.admin.value))
        db.commit()

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_admin(db)
        seed_entries(db)
    finally:
        db.close()
        