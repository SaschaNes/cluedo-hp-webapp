// frontend/src/App.jsx
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
    overflow = "hidden", // ✅ FIX: allow some tiles to not clip neighbors
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
      overflow, // ✅ FIX: default hidden, but can be visible where needed
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

    const glowLine =
      v === "panel"
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
      <div
        style={{
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          display: "grid",
          alignItems: "center",
          justifyItems: "stretch",
          padding: 0,
        }}
      >
        <div
          style={{
            height: 96,
            width: "90%",
            borderRadius: 16,
            background: `
              radial-gradient(140% 160% at 15% 10%, rgba(235,215,175,0.88), rgba(215,185,135,0.82) 55%, rgba(165,125,75,0.75)),
              radial-gradient(120% 120% at 85% 85%, rgba(255,255,255,0.10), transparent 60%),
              linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0.26))
            `,
            boxShadow:
              "inset 0 0 0 1px rgba(0,0,0,0.20), inset 0 18px 40px rgba(0,0,0,0.18), 0 16px 40px rgba(0,0,0,0.40)",
            position: "relative",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            padding: "14px 16px",
          }}
        >
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

          <div
            style={{
              position: "absolute",
              inset: 10,
              borderRadius: 12,
              border: "1px solid rgba(202,162,74,0.40)",
              boxShadow: "inset 0 0 0 1px rgba(242,210,122,0.14)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, position: "relative" }}>
            <div
              style={{
                color: GOLD,
                fontWeight: 900,
                fontSize: 44,
                letterSpacing: 0.6,
                lineHeight: 1,
                textShadow: "0 1px 0 rgba(0,0,0,0.38), 0 0 20px rgba(242,210,122,0.28)",
              }}
            >
              {value}
            </div>

            <div
              style={{
                color: GOLD,
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: 1.4,
                transform: "translateY(-6px)",
                textShadow: "0 1px 0 rgba(0,0,0,0.32), 0 0 14px rgba(242,210,122,0.22)",
                opacity: 0.95,
              }}
            >
              HP
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 12,
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

  // ✅ 3 Würfel: 2x d6 + 1x Spezial (Häuser + Hilfkarte + Dunkles Deck)

  const DicePanel = ({ onRoll }) => {
  const LS_KEY = "hp_cluedo_dice_v1";

  const [d1, setD1] = useState(4);
  const [d2, setD2] = useState(2);
  const [special, setSpecial] = useState("gryffindor");

  // angles (absolute)
  const [a1, setA1] = useState({ x: 0, y: 90 });   // start showing 4 (ry=90)
  const [a2, setA2] = useState({ x: -90, y: 0 });  // start showing 2 (rx=-90)
  const [as, setAs] = useState({ x: 0, y: 0 });    // gryffindor mapped below

  const [rolling, setRolling] = useState(false);

  // commit targets (avoid “result earlier than animation”)
  const pendingRef = useRef(null);
  const doneCountRef = useRef(0);

  const specialFaces = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff", "help", "dark"];
  const order = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff", "help", "dark"];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // restore last result
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.d1) setD1(parsed.d1);
      if (parsed?.d2) setD2(parsed.d2);
      if (parsed?.special) setSpecial(parsed.special);

      // set angles matching restored values
      if (parsed?.d1) {
        const r = cubeRotationForD6(parsed.d1);
        setA1({ x: r.rx, y: r.ry });
      }
      if (parsed?.d2) {
        const r = cubeRotationForD6(parsed.d2);
        setA2({ x: r.rx, y: r.ry });
      }
      if (parsed?.special) {
        const idx = Math.max(0, order.indexOf(parsed.special));
        const r = cubeRotationForD6(idx + 1);
        setAs({ x: r.rx, y: r.ry });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ d1, d2, special }));
    } catch {}
  }, [d1, d2, special]);

  const normalize360 = (n) => ((n % 360) + 360) % 360;

  const rollTo = (currentAngles, targetBase) => {
    // add big spins but land exactly on base orientation modulo 360
    const spinX = 720 + randInt(0, 2) * 360;
    const spinY = 720 + randInt(0, 2) * 360;

    const currX = normalize360(currentAngles.x);
    const currY = normalize360(currentAngles.y);

    const dx = targetBase.rx - currX;
    const dy = targetBase.ry - currY;

    return {
      x: currentAngles.x + spinX + dx,
      y: currentAngles.y + spinY + dy,
    };
  };

  const rollAll = () => {
    if (rolling) return;

    const nd1 = randInt(1, 6);
    const nd2 = randInt(1, 6);
    const ns = specialFaces[randInt(0, specialFaces.length - 1)];

    const r1 = cubeRotationForD6(nd1);
    const r2 = cubeRotationForD6(nd2);
    const rs = cubeRotationForD6(Math.max(0, order.indexOf(ns)) + 1);

    pendingRef.current = { nd1, nd2, ns };
    doneCountRef.current = 0;

    setRolling(true);

    // start roll immediately (angles change drives the animation)
    setA1((cur) => rollTo(cur, r1));
    setA2((cur) => rollTo(cur, r2));
    setAs((cur) => rollTo(cur, rs));
  };

  const onOneDone = () => {
    doneCountRef.current += 1;
    if (doneCountRef.current < 3) return;

    const p = pendingRef.current;
    if (!p) return;

    setD1(p.nd1);
    setD2(p.nd2);
    setSpecial(p.ns);

    setRolling(false);
    pendingRef.current = null;

    onRoll?.({ d1: p.nd1, d2: p.nd2, special: p.ns });
  };

  return (
    <div style={{ pointerEvents: "auto" }}>
      {/* ✅ no container background/border anymore */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ color: stylesTokens.textMain, fontWeight: 900, fontSize: 13 }}>
            Würfel
          </div>
          <div style={{ color: stylesTokens.textDim, fontWeight: 900, fontSize: 11.5, letterSpacing: 0.7, opacity: 0.75 }}>
            {rolling ? "ROLL…" : "READY"}
          </div>
        </div>

        <div
          className="diceRow3d"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            alignItems: "center",
            justifyItems: "center",
            overflow: "visible",
          }}
        >
          <DieD6
            value={d1}
            rolling={rolling}
            onClick={rollAll}
            ax={a1.x}
            ay={a1.y}
            onDone={onOneDone}
          />
          <DieD6
            value={d2}
            rolling={rolling}
            onClick={rollAll}
            ax={a2.x}
            ay={a2.y}
            onDone={onOneDone}
          />
          <HouseDie
            face={special}
            rolling={rolling}
            onClick={rollAll}
            ax={as.x}
            ay={as.y}
            onDone={onOneDone}
          />
        </div>

        <div style={{ color: stylesTokens.textDim, fontSize: 12, opacity: 0.95 }}>
          Klicken zum Rollen
        </div>
      </div>
    </div>
  );
};


  const DieShell = ({ children, rolling = false, onClick }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className="die3d"
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          border: "none",            // ✅ no border
          background: "transparent",  // ✅ no tile bg
          boxShadow: "none",          // ✅ no frame shadow
          position: "relative",
          overflow: "visible",
          display: "grid",
          placeItems: "center",
          cursor: rolling ? "default" : "pointer",
          transition: "transform 160ms ease",
          padding: 0,
          outline: "none",
        }}
        disabled={rolling}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </button>
    );
  };
  

  /* map value->cube rotation so that value face is FRONT
     Face layout:
     front=1, back=6, top=2, bottom=5, right=3, left=4
  */
  const cubeRotationForD6 = (value) => {
    switch (value) {
      case 1: return { rx: 0,   ry: 0   };
      case 2: return { rx: -90, ry: 0   };
      case 3: return { rx: 0,   ry: -90 };
      case 4: return { rx: 0,   ry: 90  };
      case 5: return { rx: 90,  ry: 0   };
      case 6: return { rx: 0,   ry: 180 };
      default: return { rx: 0,  ry: 0   };
    }
  };

  const PipFace = ({ value }) => {
    // pip positions: 0..2 grid
    const pos = (gx, gy) => ({ left: `${gx * 50}%`, top: `${gy * 50}%` });

    const faces = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [2, 0], [0, 2], [2, 2]],
      5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
    };

    const arr = faces[value] || faces[1];

    return (
      <div className="pipGrid">
        {arr.map(([x, y], idx) => (
          <div
            key={idx}
            className="pip"
            style={{
              ...pos(x, y),
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>
    );
  };

  const DieD6 = ({ value = 1, rolling = false, onClick, ax, ay, onDone }) => {
  return (
    <DieShell rolling={rolling} onClick={onClick}>
      <div className="dieCubeWrap">
        <div
          className={`dieCube ${rolling ? "rolling" : ""}`}
          style={{ "--rx": ax, "--ry": ay }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "transform") return;
            if (rolling) onDone?.();
          }}
        >
          <div className="dieFace front"><PipFace value={1} /></div>
          <div className="dieFace back"><PipFace value={6} /></div>
          <div className="dieFace top"><PipFace value={2} /></div>
          <div className="dieFace bottom"><PipFace value={5} /></div>
          <div className="dieFace right"><PipFace value={3} /></div>
          <div className="dieFace left"><PipFace value={4} /></div>
        </div>
      </div>
    </DieShell>
  );
};


  const HouseDie = ({ face = "gryffindor", rolling = false, onClick, ax, ay, onDone }) => {
  const faces = {
    gryffindor: { icon: "🦁", color: "#ef4444" },
    slytherin: { icon: "🐍", color: "#22c55e" },
    ravenclaw: { icon: "🦅", color: "#3b82f6" },
    hufflepuff: { icon: "🦡", color: "#facc15" },
    help: { icon: "🃏", color: "#f2d27a" },
    dark: { icon: "🌙", color: "rgba(255,255,255,0.85)" },
  };

  const order = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff", "help", "dark"];
  const f = faces[face] || faces.gryffindor;

  return (
    <DieShell rolling={rolling} onClick={onClick}>
      <div className="dieCubeWrap">
        <div
          className={`dieCube ${rolling ? "rolling" : ""}`}
          style={{ "--rx": ax, "--ry": ay }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "transform") return;
            if (rolling) onDone?.();
          }}
        >
          {order.map((key, i) => {
            const item = faces[key];
            const faceClass =
              i === 0 ? "front" :
              i === 1 ? "top" :
              i === 2 ? "right" :
              i === 3 ? "left" :
              i === 4 ? "bottom" :
              "back";

            return (
              <div key={key} className={`dieFace ${faceClass}`}>
                <div
                  className="specialIcon"
                  style={{
                    color: item.color,
                    textShadow: `0 0 18px ${item.color}55, 0 10px 22px rgba(0,0,0,0.55)`,
                  }}
                >
                  {item.icon}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DieShell>
  );
};

  


  const PlayerIdentityCard = ({
    name = "Harry Potter",
    houseLabel = "Gryffindor",
    borderColor = "#7c4dff",
    img = "/player_cards/harry.png",
  }) => {
    return (
      <div
        style={{
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          display: "grid",
          alignItems: "center",
          overflow: "visible",
          position: "relative", // ✅ FIX: enable clean stacking context
          zIndex: 5, // ✅ FIX: sit above neighbors
        }}
      >
        <div
          style={{
            height: "100%",
            minHeight: 0,
            minWidth: 0,
            borderRadius: 18,
            border: "none",
            background: "transparent",
            backdropFilter: "none",
            boxShadow: "none",
            padding: 12,
            overflow: "visible",
            position: "relative",
            zIndex: 5, // ✅ FIX
            display: "grid",
            alignItems: "center",
            justifyItems: "start",
          }}
        >
          <div
            style={{
              width: "48%",
              maxWidth: 220,
              aspectRatio: "63 / 88",
              borderRadius: 16,
              border: `2px solid ${borderColor}`,
              boxShadow: `0 18px 55px rgba(0,0,0,0.55), 0 0 26px rgba(124,77,255,0.22)`,
              overflow: "hidden", // ✅ important: crop image to rounded corners
              position: "relative",
              background: "rgba(0,0,0,0.15)",
              transform: "translateY(-10px) rotate(-0.6deg)",
              transformOrigin: "center bottom",
              transition: "transform 180ms ease, box-shadow 180ms ease",
              cursor: "pointer",
              marginLeft: 20,
              zIndex: 50, // ✅ keep above other tiles
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              const rx = (0.5 - y) * 6;
              const ry = (x - 0.5) * 8;

              e.currentTarget.style.transform = `translateY(-16px) rotate(-0.6deg) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-10px) rotate(-0.6deg)";
              e.currentTarget.style.boxShadow = `0 18px 55px rgba(0,0,0,0.55), 0 0 26px rgba(124,77,255,0.22)`;
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-18px) rotate(-0.6deg)";
              e.currentTarget.style.boxShadow = `0 26px 70px rgba(0,0,0,0.62), 0 0 34px ${borderColor}`;
            }}
          >
            <img
              src={img}
              alt={name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.02)",
                filter: "contrast(1.02) saturate(1.06)",
                display: "block",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.10) 0%, transparent 35%, transparent 70%, rgba(255,255,255,0.06) 100%)",
                pointerEvents: "none",
                opacity: 0.7,
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                bottom: 10,
                borderRadius: 12,
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(6px)",
                padding: "10px 12px",
                display: "grid",
                gap: 4,
              }}
            >
              <div
                style={{
                  color: stylesTokens.textMain,
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: 0.2,
                  lineHeight: 1.1,
                  textShadow: "0 10px 30px rgba(0,0,0,0.55)",
                }}
              >
                {name}
              </div>

              <div
                style={{
                  color: stylesTokens.textDim,
                  fontSize: 11.5,
                  opacity: 0.92,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: borderColor,
                    boxShadow: `0 0 16px ${borderColor}`,
                    opacity: 0.9,
                  }}
                />
                {houseLabel}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                fontSize: 10.5,
                fontWeight: 900,
                letterSpacing: 1.2,
                padding: "4px 8px",
                borderRadius: 999,
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.28)",
                backdropFilter: "blur(6px)",
                textTransform: "uppercase",
              }}
            >
              Identity
            </div>
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

              <div className="diceOverlay">
                <DicePanel
                  onRoll={({ d1, d2, special }) => {
                    console.log("Rolled:", { d1, d2, special });
                    // später: API call / game action
                    // api(`/games/${gameId}/roll`, { method:"POST", body: JSON.stringify({ d1,d2,special }) })
                  }}
                />
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
            <PlayerIdentityCard
              name="Harry Potter"
              houseLabel="Signature of Holder"
              borderColor="#7c4dff"
              img="/player_cards/harry.png"
            />

            <div className="playerHudMiddle">
              {/* ✅ FIX: these were clipping your hovering/overlapping player card */}
              <PlaceholderCard title="Meine Geheimkarten" variant="tile" overflow="visible" />
              <PlaceholderCard title="Meine Hilfkarte(n)" variant="tile" overflow="visible" />
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
            <div style={{ fontWeight: 900, color: stylesTokens.textMain, fontSize: 14 }}>Notizen</div>
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

      <ChipModal chipOpen={chipOpen} closeChipModalToDash={closeChipModalToDash} chooseChip={chooseChip} />
    </div>
  );
}
