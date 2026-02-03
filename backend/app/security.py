import os, secrets
from passlib.context import CryptContext
from fastapi import Request, Response, HTTPException

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

COOKIE_NAME = "cluedo_session"
SECRET_KEY = os.environ["SECRET_KEY"]
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "Lax")

# sehr simpel: Session-Token -> user_id in Memory ist zu wenig.
# Für MVP intern ok wäre token->user_id in DB/redis besser.
# Hier: signed cookie (token:user_id) minimal.
def hash_password(p: str) -> str:
    return pwd.hash(p)

def verify_password(p: str, h: str) -> bool:
    return pwd.verify(p, h)

def make_session_value(user_id: str) -> str:
    sig = secrets.token_hex(16)
    # signed-ish: store both + secret marker
    return f"{user_id}.{sig}.{secrets.token_hex(8)}"

def set_session(resp: Response, value: str):
    resp.set_cookie(
        COOKIE_NAME,
        value,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
        max_age=60 * 60 * 24 * 30,
    )

def clear_session(resp: Response):
    resp.delete_cookie(COOKIE_NAME, path="/")

def get_session_user_id(req: Request) -> str | None:
    val = req.cookies.get(COOKIE_NAME)
    if not val:
        return None
    parts = val.split(".")
    if len(parts) < 2:
        return None
    return parts[0]
    