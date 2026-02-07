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

  /**
   * ✅ Unified Placeholder system
   * Variants:
   * - "compact": small top / dice (low height)
   * - "tile": normal cards (HUD, decks, etc.)
   * - "panel": large container (Board)
   */
  const PlaceholderCard = ({
    title,
    subtitle = "(placeholder)",
    variant = "tile",
    icon = null,
    children = null,
  }) => {
    const v = variant;

    const pad = v === "compact" ? 10 : v === "panel" ? 14 : 12;
    const titleSize = v === "compact" ? 12.5 : v === "panel" ? 14.5 : 13;
    const subSize = v === "compact" ? 11.5 : 12;
    const dashHeight = v === "compact" ? 46 : v === "panel" ? null : 64;

    const base = {
      borderRadius: 18,
      border: `1px solid ${stylesTokens.panelBorder}`,
      background: stylesTokens.panelBg,
      boxShadow: v === "panel" ? "0 20px 70px rgba(0,0,0,0.45)" : "0 12px 30px rgba(0,0,0,0.35)",
      backdropFilter: "blur(10px)",
      padding: pad,
      overflow: "hidden",
      minWidth: 0,
      position: "relative",
    };

    const headerRow = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    };

    const titleStyle = {
      fontWeight: 900,
      color: stylesTokens.textMain,
      fontSize: titleSize,
      letterSpacing: 0.2,
      lineHeight: 1.15,
    };

    const subStyle = {
      marginTop: 6,
      color: stylesTokens.textDim,
      fontSize: subSize,
      opacity: 0.95,
      lineHeight: 1.25,
    };

    const dashStyle = {
      marginTop: v === "compact" ? 8 : 10,
      height: dashHeight,
      borderRadius: 14,
      border: `1px dashed ${stylesTokens.panelBorder}`,
      opacity: 0.75,
    };

    const glowLine = v === "panel"
      ? {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, transparent, ${stylesTokens.goldLine}, transparent)`,
          opacity: 0.18,
          pointerEvents: "none",
        }
      : null;

    return (
      <div style={base}>
        {v === "panel" ? <div style={glowLine} /> : null}

        <div
          style={{
            position: "relative",
            height: v === "panel" ? "100%" : "auto",
            display: v === "panel" ? "flex" : "block",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={headerRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {icon ? <div style={{ opacity: 0.95 }}>{icon}</div> : null}
              <div style={{ ...titleStyle, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {title}
              </div>
            </div>
          </div>

          {subtitle ? <div style={subStyle}>{subtitle}</div> : null}

          {/* Content area */}
          {children ? (
            <div style={{ marginTop: v === "compact" ? 8 : 10, minHeight: 0 }}>{children}</div>
          ) : v === "panel" ? null : (
            <div style={dashStyle} />
          )}
        </div>
      </div>
    );
  };

  // Player rail placeholder (rechts vom Board, vor Notizen)
  const players = [
    {
      id: "harry",
      name: "Harry Potter",
      img: "/players/harry.jpg",
      color: "#7c4dff", // Lila
      active: true,
    },
    {
      id: "ginny",
      name: "Ginny Weasley",
      img: "/players/ginny.jpg",
      color: "#3b82f6", // Blau
    },
    {
      id: "hermione",
      name: "Hermine Granger",
      img: "/players/hermione.jpg",
      color: "#ef4444", // Rot
    },
    {
      id: "luna",
      name: "Luna Lovegood",
      img: "/players/luna.jpg",
      color: "#e5e7eb", // Weiß
    },
    {
      id: "neville",
      name: "Neville Longbottom",
      img: "/players/neville.jpg",
      color: "#22c55e", // Grün
    },
    {
      id: "ron",
      name: "Ron Weasley",
      img: "/players/ron.jpg",
      color: "#facc15", // Gelb
    },
  ];

  const PlayerIcon = ({ player }) => {
    const size = player.active ? 56 : 40;

    return (
      <div
        title={player.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          padding: 3,
          background: player.color,
          boxShadow: player.active
            ? `0 0 0 2px ${player.color}, 0 0 22px ${player.color}`
            : `0 0 0 1px ${player.color}, 0 8px 20px rgba(0,0,0,.35)`,
          transition: "all 160ms ease",
          opacity: player.active ? 1 : 0.75,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <img
            src={player.img}
            alt={player.name}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: player.active ? "none" : "grayscale(40%)",
            }}
          />
        </div>
      </div>
    );
  };

  const HogwartsPointsCard = ({ value = 0 }) => {
    const GOLD = "#f2d27a";

    return (
      // SLOT: gleiche "Card"-Geometrie wie deine Placeholders (Spacing/Radius)
      <div
        style={{
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          borderRadius: 18,
          border: `1px solid ${stylesTokens.panelBorder}`,
          background: "rgba(0,0,0,0.10)",   // sehr dezent, quasi unsichtbar
          backdropFilter: "blur(8px)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.30)",
          padding: 12,                      // ✅ Abstand wie andere Elemente
          overflow: "hidden",
          display: "grid",
          placeItems: "stretch",
        }}
      >
        {/* PAPER inset: füllt den Slot, aber mit eigenen Rundungen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            borderRadius: 16,               // ✅ klare Rundung sichtbar
            background: `
              radial-gradient(140% 160% at 15% 10%, rgba(235,215,175,0.88), rgba(215,185,135,0.82) 55%, rgba(165,125,75,0.75)),
              radial-gradient(120% 120% at 85% 85%, rgba(255,255,255,0.10), transparent 60%),
              linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0.26))
            `,
            boxShadow:
              "inset 0 0 0 1px rgba(0,0,0,0.20), inset 0 20px 45px rgba(0,0,0,0.24), 0 16px 40px rgba(0,0,0,0.35)",
            position: "relative",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            padding: "16px 16px",
          }}
        >
          {/* Papier-Flecken */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(circle at 22% 36%, rgba(90,60,25,0.14), transparent 42%),
                radial-gradient(circle at 70% 30%, rgba(90,60,25,0.10), transparent 38%),
                radial-gradient(circle at 58% 76%, rgba(255,255,255,0.08), transparent 46%)
              `,
              opacity: 0.65,
              pointerEvents: "none",
            }}
          />

          {/* Innere Goldlinie */}
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: 14,
              border: "1px solid rgba(202,162,74,0.40)",
              boxShadow: "inset 0 0 0 1px rgba(242,210,122,0.14)",
              pointerEvents: "none",
            }}
          />

          {/* Wert */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              position: "relative",
            }}
          >
            <div
              style={{
                color: GOLD,
                fontWeight: 900,
                fontSize: 52,
                letterSpacing: 0.6,
                lineHeight: 1,
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.38), 0 0 20px rgba(242,210,122,0.28)",
              }}
            >
              {value}
            </div>

            <div
              style={{
                color: GOLD,
                fontWeight: 900,
                fontSize: 19,
                letterSpacing: 1.4,
                transform: "translateY(-7px)",
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.32), 0 0 14px rgba(242,210,122,0.22)",
                opacity: 0.95,
              }}
            >
              HP
            </div>
          </div>

          {/* Siegel */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              color: "rgba(60,40,18,0.55)",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              transform: "rotate(-6deg)",
              border: "1px solid rgba(60,40,18,0.25)",
              borderRadius: 999,
              padding: "3px 8px",
              background: "rgba(255,255,255,0.10)",
            }}
          >
            SCORE
          </div>
        </div>
      </div>
    );
  };
  




  

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
            <PlaceholderCard title="User Dropdown" variant="compact" />
            <PlaceholderCard title="Einstellungen" variant="compact" />
          </div>

          {/* Main: Tools | Board | Player Rail */}
          <div className="mainRow">
            {/* Left of board: Board decks */}
            <div className="leftTools">
              <div className="leftToolsRow">
                <PlaceholderCard title="Hilfskarten (Deck)" variant="tile" />
                <PlaceholderCard title="Dunkles Deck" variant="tile" />
              </div>
            </div>

            {/* Board: big */}
            <div className="boardWrap">
              <PlaceholderCard
                title="3D Board / Game View"
                subtitle="Platzhalter – hier kommt später das Board + Figuren rein."
                variant="panel"
              >
                {/* 👇 DAS ist neu */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    borderRadius: 18,
                    border: `1px dashed ${stylesTokens.panelBorder}`,
                    opacity: 0.35,
                  }}
                />
              </PlaceholderCard>

              {/* Dice overlay bleibt gleich */}
              <div className="diceOverlay">
                <PlaceholderCard title="Würfel" variant="compact" />
              </div>
            </div>

            {/* Right of board: player rail */}
            <div className="playerRail">
              <div className="playerRailTitle">Spieler</div>

              <div className="playerRailInner">
                <div className="playerRailList">
                  {players.map((p) => (
                    <PlayerIcon key={p.id} player={p} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Player HUD */}
          <div className="playerHud">
            <PlaceholderCard title="Spielerkarte (User)" variant="tile" />

            <div className="playerHudMiddle">
              <PlaceholderCard title="Meine Geheimkarten" variant="tile" />
              <PlaceholderCard title="Meine Hilfkarte(n)" variant="tile" />
            </div>

            <HogwartsPointsCard value={60} />
          </div>
        </section>

        {/* RIGHT: Notes Panel */}
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
