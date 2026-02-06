import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { api } from "./api/client";
import { cycleTag } from "./utils/cycleTag";
import { getChipLS, setChipLS, clearChipLS } from "./utils/chipStorage";

import { useHpGlobalStyles } from "./styles/hooks/useHpGlobalStyles";
import { styles } from "./styles/styles";
import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";
import { stylesTokens } from "./styles/theme";

import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import TopBar from "./components/TopBar";
import PasswordModal from "./components/PasswordModal";
import ChipModal from "./components/ChipModal";
import HelpModal from "./components/HelpModal";
import GamePickerCard from "./components/GamePickerCard";
import SheetSection from "./components/SheetSection";
import DesignModal from "./components/DesignModal";
import WinnerCard from "./components/WinnerCard";
import WinnerBadge from "./components/WinnerBadge";
import NewGameModal from "./components/NewGameModal";
import StatsModal from "./components/StatsModal";

export default function App() {
  useHpGlobalStyles();

  // Auth/Login UI state
  const [me, setMe] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Game/Sheet state
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  // Game meta
  const [gameMeta, setGameMeta] = useState(null); // {code, host_user_id, winner_email, winner_user_id}
  const [members, setMembers] = useState([]);

  // Winner selection (host only)
  const [winnerUserId, setWinnerUserId] = useState("");

  // Modals
  const [helpOpen, setHelpOpen] = useState(false);
  const [chipOpen, setChipOpen] = useState(false);
  const [chipEntry, setChipEntry] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Theme
  const [designOpen, setDesignOpen] = useState(false);
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);

  // New Game Modal
  const [newGameOpen, setNewGameOpen] = useState(false);

  // ===== Stats Modal =====
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // ===== Join Snack (bottom toast) =====
  const [snack, setSnack] = useState("");
  const snackTimerRef = useRef(null);

  // track members to detect joins
  const lastMemberIdsRef = useRef(new Set());
  const membersBaselineRef = useRef(false);

  const showSnack = (msg) => {
    setSnack(msg);
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    snackTimerRef.current = setTimeout(() => setSnack(""), 1800);
  };

  const vibrate = (pattern) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  };

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const tk = m?.theme_key || DEFAULT_THEME_KEY;
    setThemeKey(tk);
    applyTheme(tk);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

  const reloadSheet = async () => {
    if (!gameId) return;
    const sh = await api(`/games/${gameId}/sheet`);
    setSheet(sh);
  };

  const loadGameMeta = async () => {
    if (!gameId) return;

    const meta = await api(`/games/${gameId}`);
    setGameMeta(meta);
    setWinnerUserId(meta?.winner_user_id || "");

    const mem = await api(`/games/${gameId}/members`);
    setMembers(mem);

    // ✅ detect new members (join notifications for everyone)
    try {
      const prev = lastMemberIdsRef.current;
      const nowIds = new Set((mem || []).map((m) => String(m.id)));

      if (!membersBaselineRef.current) {
        // first load for this game -> set baseline, no notification
        membersBaselineRef.current = true;
        lastMemberIdsRef.current = nowIds;
        return;
      }

      const added = (mem || []).filter((m) => !prev.has(String(m.id)));

      if (added.length > 0) {
        const names = added
          .map((m) => ((m.display_name || "").trim() || (m.email || "").trim() || "Jemand"))
          .slice(0, 3);

        const msg =
          added.length === 1
            ? `✨ ${names[0]} ist beigetreten`
            : `✨ ${names.join(", ")} ${added.length > 3 ? `(+${added.length - 3}) ` : ""}sind beigetreten`;

        showSnack(msg);
        vibrate(25); // dezent & kurz
      }

      lastMemberIdsRef.current = nowIds;
    } catch {
      // ignore snack errors
    }
  };

  // Dropdown outside click
  useEffect(() => {
    const onDown = (e) => {
      const root = e.target?.closest?.("[data-user-menu]");
      if (!root) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userMenuOpen]);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // on game change
  useEffect(() => {
    // reset join detection baseline when switching games
    membersBaselineRef.current = false;
    lastMemberIdsRef.current = new Set();

    (async () => {
      if (!gameId) return;
      try {
        await reloadSheet();
        await loadGameMeta();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // ✅ Live refresh (Members/Meta) – damit neue Joiner ohne Reload sichtbar sind
  // Für 5–6 Spieler reicht 2.5s völlig, ist "live genug" und schont Backend.
  useEffect(() => {
    if (!me || !gameId) return;

    let alive = true;

    const tick = async () => {
      try {
        await loadGameMeta(); // refresh members + winner meta
      } catch {
        // ignore
      }
    };

    // sofort einmal ziehen
    tick();

    const id = setInterval(() => {
      if (!alive) return;
      tick();
    }, 2500);

    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, gameId]);

  // ===== Auth actions =====
  const doLogin = async () => {
    await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    await load();
  };

  const doLogout = async () => {
    await api("/auth/logout", { method: "POST" });
    setMe(null);
    setGames([]);
    setGameId(null);
    setSheet(null);
    setGameMeta(null);
    setMembers([]);
    setWinnerUserId("");
  };

  // ===== Password =====
  const openPwModal = () => {
    setPwMsg("");
    setPw1("");
    setPw2("");
    setPwOpen(true);
    setUserMenuOpen(false);
  };

  const closePwModal = () => {
    setPwOpen(false);
    setPwMsg("");
    setPw1("");
    setPw2("");
  };

  const savePassword = async () => {
    setPwMsg("");

    if (!pw1 || pw1.length < 8) return setPwMsg("❌ Passwort muss mindestens 8 Zeichen haben.");
    if (pw1 !== pw2) return setPwMsg("❌ Passwörter stimmen nicht überein.");

    setPwSaving(true);
    try {
      await api("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ password: pw1 }),
      });
      setPwMsg("✅ Passwort gespeichert.");
      setTimeout(() => closePwModal(), 650);
    } catch (e) {
      setPwMsg("❌ Fehler: " + (e?.message || "unknown"));
    } finally {
      setPwSaving(false);
    }
  };

  // ===== Theme =====
  const openDesignModal = () => {
    setDesignOpen(true);
    setUserMenuOpen(false);
  };

  const selectTheme = async (key) => {
    setThemeKey(key);
    applyTheme(key);

    try {
      await api("/auth/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme_key: key }),
      });
    } catch {
      // theme locally already applied; ignore backend error
    }
  };

  // ===== Stats (always fresh on open) =====
  const openStatsModal = async () => {
    setUserMenuOpen(false);
    setStatsOpen(true);
    setStatsError("");
    setStatsLoading(true);

    try {
      const s = await api("/auth/me/stats");
      setStats(s);
    } catch (e) {
      setStats(null);
      setStatsError("❌ Fehler: " + (e?.message || "unknown"));
    } finally {
      setStatsLoading(false);
    }
  };

  const closeStatsModal = () => {
    setStatsOpen(false);
    setStatsError("");
  };

  // ===== New game flow =====
  const createGame = async () => {
    // ✅ alten Game-State komplett loswerden, damit nix am alten Spiel "hängen bleibt"
    setSheet(null);
    setGameMeta(null);
    setMembers([]);
    setWinnerUserId("");
    setPulseId(null);

    // auch Chip-Modal-State resetten
    setChipOpen(false);
    setChipEntry(null);

    const g = await api("/games", {
      method: "POST",
      body: JSON.stringify({ name: "Spiel " + new Date().toLocaleString() }),
    });

    const gs = await api("/games");
    setGames(gs);

    // ✅ auf neues Game wechseln (triggert reloadSheet/loadGameMeta via effect)
    setGameId(g.id);

    return g; // includes code
  };

  const joinGame = async (code) => {
    const res = await api("/games/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    });

    const gs = await api("/games");
    setGames(gs);
    setGameId(res.id);
  };

  // ===== Winner =====
  const saveWinner = async () => {
    if (!gameId) return;
    await api(`/games/${gameId}/winner`, {
      method: "PATCH",
      body: JSON.stringify({ winner_user_id: winnerUserId || null }),
    });
    await loadGameMeta();
  };

  // ===== Sheet actions =====
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
      // Prefer backend chip, fallback localStorage
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

  const isHost = !!(me?.id && gameMeta?.host_user_id && me.id === gameMeta.host_user_id);

  return (
    <div style={styles.page}>
      <div style={styles.bgFixed} aria-hidden="true">
        <div style={styles.bgMap} />
      </div>

      <div style={styles.shell}>
        <TopBar
          me={me}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          openPwModal={openPwModal}
          openDesignModal={openDesignModal}
          openStatsModal={openStatsModal}
          doLogout={doLogout}
          onOpenNewGame={() => setNewGameOpen(true)}
        />

        {me.role === "admin" && <AdminPanel />}

        <GamePickerCard
          games={games}
          gameId={gameId}
          setGameId={setGameId}
          onOpenHelp={() => setHelpOpen(true)}
        />

        {/* Sieger Badge: zwischen Spiel und Verdächtigte Person */}
        <WinnerBadge
          winner={{
            display_name: gameMeta?.winner_display_name || "",
            email: gameMeta?.winner_email || "",
          }}
        />

        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

        <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
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

        {/* Host-only Winner Auswahl */}
        <WinnerCard
          isHost={isHost}
          members={members}
          winnerUserId={winnerUserId}
          setWinnerUserId={setWinnerUserId}
          onSave={saveWinner}
        />

        <div style={{ height: 24 }} />
      </div>

      <PasswordModal
        pwOpen={pwOpen}
        closePwModal={closePwModal}
        pw1={pw1}
        setPw1={setPw1}
        pw2={pw2}
        setPw2={setPw2}
        pwMsg={pwMsg}
        pwSaving={pwSaving}
        savePassword={savePassword}
      />

      <DesignModal
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        themeKey={themeKey}
        onSelect={(k) => {
          selectTheme(k);
          setDesignOpen(false);
        }}
      />

      <NewGameModal
        open={newGameOpen}
        onClose={() => setNewGameOpen(false)}
        onCreate={createGame}
        onJoin={joinGame}
        currentCode={gameMeta?.code || ""}
        gameFinished={!!gameMeta?.winner_user_id}
        hasGame={!!gameId}
        currentMembers={members}
      />

      <ChipModal
        chipOpen={chipOpen}
        closeChipModalToDash={closeChipModalToDash}
        chooseChip={chooseChip}
      />

      <StatsModal
        open={statsOpen}
        onClose={closeStatsModal}
        me={me}
        stats={stats}
        loading={statsLoading}
        error={statsError}
      />

      {/* Bottom snack for joins */}
      {snack &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 14,
              transform: "translateX(-50%)",
              maxWidth: "92vw",
              padding: "10px 12px",
              borderRadius: 14,
              border: `1px solid ${stylesTokens.panelBorder}`,
              background: stylesTokens.panelBg,
              color: stylesTokens.textMain,
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              backdropFilter: "blur(6px)",
              fontWeight: 900,
              fontSize: 13,
              textAlign: "center",
              zIndex: 2147483647,
              pointerEvents: "none",
            }}
          >
            {snack}
          </div>,
          document.body
        )
      }
    </div>
  );
}
