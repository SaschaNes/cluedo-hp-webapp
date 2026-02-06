import enum
import uuid
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from .db import Base


class Role(str, enum.Enum):
    admin = "admin"
    user = "user"


class Category(str, enum.Enum):
    suspect = "suspect"
    item = "item"
    location = "location"


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default=Role.user.value)
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # NEW: Theme im Userprofil (damit es auf anderen Geräten mitkommt)
    theme_key: Mapped[str] = mapped_column(String, default="default")


class Game(Base):
    __tablename__ = "games"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # NEW: Host (nur Host darf Winner setzen)
    host_user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)

    name: Mapped[str] = mapped_column(String)
    seed: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # NEW: Join-Code (Kahoot-Style)
    code: Mapped[str] = mapped_column(String, unique=True, index=True)

    # NEW: Winner (aus Users, nicht Freitext)
    winner_user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)


class GameMember(Base):
    __tablename__ = "game_members"
    __table_args__ = (UniqueConstraint("game_id", "user_id", name="uq_game_member"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id: Mapped[str] = mapped_column(String, ForeignKey("games.id"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    joined_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Entry(Base):
    __tablename__ = "entries"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category: Mapped[str] = mapped_column(String, index=True)
    label: Mapped[str] = mapped_column(String)


class SheetState(Base):
    __tablename__ = "sheet_state"
    __table_args__ = (
        UniqueConstraint("game_id", "owner_user_id", "entry_id", name="uq_sheet"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id: Mapped[str] = mapped_column(String, ForeignKey("games.id"), index=True)
    owner_user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    entry_id: Mapped[str] = mapped_column(String, ForeignKey("entries.id"), index=True)

    status: Mapped[int] = mapped_column(SmallInteger, default=0)  # 0 unknown, 1 crossed, 2 confirmed, 3 maybe
    note_tag: Mapped[str | None] = mapped_column(String, nullable=True)  # null | 'i' | 'm' | 's'

    # NEW: Chip persistieren (statt LocalStorage)
    chip: Mapped[str | None] = mapped_column(String, nullable=True)
    