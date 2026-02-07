import React, { useEffect, useRef, useState } from "react";

import { api } from "./api/client";
import { cycleTag } from "./utils/cycleTag";
import { getChipLS, setChipLS, clearChipLS } from "./utils/chipStorage";

import { useHpGlobalStyles } from "./styles/hooks/useHpGlobalStyles";
import { styles } from "./styles/styles";
import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";
import { stylesTokens } from "./styles/theme";

import LoginPage from "./components/LoginPage";
import SheetSection from "./components/SheetSection";
import ChipModal from "./components/ChipModal";

import "./AppLayout.css";

export default function App() {
  useHpGlobalStyles();

  // Auth/Login UI state
  const [me, setMe] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Game/Sheet state (minimal)
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  // Chip modal
  const [chipOpen, setChipOpen] = useState(false);
  const [chipEntry, setChipEntry] = useState(null);

  const aliveRef = useRef(true);

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const tk = m?.theme_key || DEFAULT_THEME_KEY;
    applyTheme(tk);

    const gs = await api("/games");
    setGames(gs);

    // Auto-pick first game (kein UI dafür)
    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

  const reloadSheet = async () => {
    if (!gameId) return;
    const sh = await api(`/games/${gameId}/sheet`);
    setSheet(sh);
  };

  // initial load
  useEffect(() => {
    aliveRef.current = true;
    (async () => {
      try {
        await load();
      } catch {
        // ignore
      }
    })();
    return () => {
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // on game change
  useEffect(() => {
    (async () => {
      if (!gameId) return;
      try {
        await reloadSheet();
      } catch {
        // ignore
      }
    })();
  }, [gameId]);

  // Live refresh (nur Sheet)
  useEffect(() => {
    if (!me || !gameId) return;

    let alive = true;
    const tick = async () => {
      try {
        await reloadSheet();
      } catch {}
    };

    tick();
    const id = setInterval(() => {
      if (!alive) return;
      tick();
    }, 2500);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [me?.id, gameId]);

  // ===== Auth actions =====
  const doLogin = async () => {
    await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    await load();
  };

  // ===== Sheet actions (wie bisher) =====
  const cycleStatus = async (entry) => {
    let next = 0;
    if (entry.status === 0) next = 2;
    else if (entry.status === 2) next = 1;
    else if (entry.status === 1) next = 3;
    else next = 0;

    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });

    await reloadSheet();
    setPulseId(entry.entry_id);
    setTimeout(() => setPulseId(null), 220);
  };

  const toggleTag = async (entry) => {
    const next = cycleTag(entry.note_tag);

    if (next === "s") {
      setChipEntry(entry);
      setChipOpen(true);
      return;
    }

    if (next === null) clearChipLS(gameId, entry.entry_id);

    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ note_tag: next, chip: null }),
    });

    await reloadSheet();
  };

  const chooseChip = async (chip) => {
    if (!chipEntry) return;

    const entry = chipEntry;
    setChipOpen(false);
    setChipEntry(null);

    setChipLS(gameId, entry.entry_id, chip);

    try {
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: "s", chip }),
      });
    } finally {
      await reloadSheet();
    }
  };

  const closeChipModalToDash = async () => {
    if (!chipEntry) {
      setChipOpen(false);
      return;
    }

    const entry = chipEntry;
    setChipOpen(false);
    setChipEntry(null);

    clearChipLS(gameId, entry.entry_id);

    try {
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: null, chip: null }),
      });
    } finally {
      await reloadSheet();
    }
  };

  const displayTag = (entry) => {
    const t = entry.note_tag;
    if (!t) return "—";

    if (t === "s") {
      const chip = entry.chip || getChipLS(gameId, entry.entry_id);
      return chip ? `s.${chip}` : "s";
    }
    return t; // i oder m
  };

  // ===== Login page =====
  if (!me) {
    return (
      <LoginPage
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        showPw={showPw}
        setShowPw={setShowPw}
        doLogin={doLogin}
      />
    );
  }

  const sections = sheet
    ? [
        { key: "suspect", title: "VERDÄCHTIGE PERSON", entries: sheet.suspect || [] },
        { key: "item", title: "GEGENSTAND", entries: sheet.item || [] },
        { key: "location", title: "ORT", entries: sheet.location || [] },
      ]
    : [];

  const PlaceholderCard = ({ title, hint, compact = false }) => (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${stylesTokens.panelBorder}`,
        background: stylesTokens.panelBg,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        padding: compact ? 10 : 12,
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div style={{ fontWeight: 900, color: stylesTokens.textMain, fontSize: 13 }}>
        {title}
      </div>
      {hint ? (
        <div style={{ marginTop: 6, color: stylesTokens.textDim, fontSize: 12, opacity: 0.95 }}>
          {hint}
        </div>
      ) : null}
      <div
        style={{
          marginTop: compact ? 8 : 10,
          height: compact ? 46 : 64,
          borderRadius: 14,
          border: `1px dashed ${stylesTokens.panelBorder}`,
          opacity: 0.8,
        }}
      />
    </div>
  );

  // Player rail placeholder (rechts vom Board, vor Notizen)
  const players = [
    { id: "p1", label: "A", active: true },
    { id: "p2", label: "B" },
    { id: "p3", label: "C" },
    { id: "p4", label: "D" },
    { id: "p5", label: "E" },
  ];

  const PlayerIcon = ({ label, active }) => (
    <div
      style={{
        width: active ? 46 : 36,
        height: active ? 46 : 36,
        borderRadius: 999,
        border: `1px solid ${stylesTokens.panelBorder}`,
        background: stylesTokens.panelBg,
        boxShadow: active ? "0 16px 40px rgba(0,0,0,0.55)" : "0 10px 28px rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        color: active ? stylesTokens.textGold : stylesTokens.textMain,
        fontWeight: 900,
        fontSize: active ? 14 : 12,
        transition: "transform 120ms ease, width 120ms ease, height 120ms ease",
      }}
      title={active ? "Aktiver Spieler" : "Spieler"}
    >
      {label}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.bgFixed} aria-hidden="true">
        <div style={styles.bgMap} />
      </div>

      <div className="appRoot">
        {/* LEFT: Game Area */}
        <section className="leftPane">
          {/* Top: User + Settings adjacent */}
          <div className="topBarRow">
            <PlaceholderCard title="User Dropdown" hint="(placeholder)" compact />
            <PlaceholderCard title="Einstellungen" hint="(placeholder)" compact />
          </div>

          {/* Main: Tools | Board | Player Rail */}
          <div className="mainRow">
            {/* Left of board: Hilfskarten-Deck + Dunkles Deck (Board decks) */}
            <div className="leftTools">
              <div className="leftToolsRow">
                <PlaceholderCard title="Hilfskarten (Deck)" hint="(placeholder)" />
                <PlaceholderCard title="Dunkles Deck" hint="(placeholder)" />
              </div>
            </div>

            {/* Board: big */}
            <div
              className="boardWrap"
              style={{
                border: `1px solid ${stylesTokens.panelBorder}`,
                background: stylesTokens.panelBg,
                boxShadow: "0 20px 70px rgba(0,0,0,0.45)",
                backdropFilter: "blur(10px)",
                padding: 12,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(90deg, transparent, ${stylesTokens.goldLine}, transparent)`,
                  opacity: 0.22,
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 900, color: stylesTokens.textMain, fontSize: 14 }}>
                  3D Board / Game View
                </div>
                <div style={{ marginTop: 6, color: stylesTokens.textDim, fontSize: 12 }}>
                  Platzhalter – hier kommt später das Board + Figuren rein.
                </div>

                <div
                  style={{
                    marginTop: 10,
                    flex: 1,
                    borderRadius: 18,
                    border: `1px dashed ${stylesTokens.panelBorder}`,
                    opacity: 0.85,
                    minHeight: 0,
                  }}
                />
              </div>

              {/* Dice: under the board slightly right (overlay) */}
              <div className="diceOverlay">
                <PlaceholderCard title="Würfel" hint="(placeholder)" compact />
              </div>
            </div>

            {/* Right of board: player rail, directly before notes */}
            <div className="playerRail">
              <div className="playerRailTitle">Spieler</div>
              <div className="playerRailList">
                {players.map((p) => (
                  <PlayerIcon key={p.id} label={p.label} active={!!p.active} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Player HUD
              Left: user card
              Middle: secret cards + player's help-card slot next to it
              Right: points
          */}
          <div className="playerHud">
            <PlaceholderCard title="Spielerkarte (User)" hint="(placeholder)" />

            <div className="playerHudMiddle">
              <PlaceholderCard title="Meine Geheimkarten" hint="(placeholder)" />
              <PlaceholderCard title="Meine Hilfkarte(n)" hint="(placeholder)" />
            </div>

            <PlaceholderCard title="Hogwarts Points" hint="(placeholder)" />
          </div>
        </section>

        {/* RIGHT: Notes Panel (scroll only here) */}
        <aside
          className="notesPane"
          style={{
            borderRadius: 22,
            border: `1px solid ${stylesTokens.panelBorder}`,
            background: stylesTokens.panelBg,
            boxShadow: "0 22px 90px rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
            padding: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 900, color: stylesTokens.textMain, fontSize: 14 }}>
              Notizen
            </div>
            <div style={{ marginTop: 6, color: stylesTokens.textDim, fontSize: 12 }}>
              Nur die 3 Tabellen (Verdächtige / Gegenstände / Orte).
            </div>
          </div>

          <div className="notesScroll">
            <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
              {sections.map((sec) => (
                <SheetSection
                  key={sec.key}
                  title={sec.title}
                  entries={sec.entries}
                  pulseId={pulseId}
                  onCycleStatus={cycleStatus}
                  onToggleTag={toggleTag}
                  displayTag={displayTag}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <ChipModal
        chipOpen={chipOpen}
        closeChipModalToDash={closeChipModalToDash}
        chooseChip={chooseChip}
      />
    </div>
  );
}
