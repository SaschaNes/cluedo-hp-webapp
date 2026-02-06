// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";

import { api } from "./api/client";
import { cycleTag } from "./utils/cycleTag";

import { useHpGlobalStyles } from "./styles/hooks/useHpGlobalStyles";
import { styles } from "./styles/styles";

import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";

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
import JoinGameModal from "./components/JoinGameModal";

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

  // Game meta / players / winner
  const [gameMeta, setGameMeta] = useState(null);
  const [players, setPlayers] = useState([]);
  const [winnerUserId, setWinnerUserId] = useState(null);

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

  // Join game
  const [joinOpen, setJoinOpen] = useState(false);

  const currentGame = useMemo(
    () => games.find((g) => String(g.id) === String(gameId)) || null,
    [games, gameId]
  );

  // ===== Data loaders =====
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

  const reloadMeta = async () => {
    if (!gameId) return;
    const meta = await api(`/games/${gameId}/meta`);
    setGameMeta(meta);
    setWinnerUserId(meta?.winner?.id || null);
  };

  const reloadPlayers = async () => {
    if (!gameId) return;
    const ps = await api(`/games/${gameId}/players`);
    setPlayers(ps);
  };

  // ===== Effects =====

  // Dropdown outside click
  useEffect(() => {
    const onDown = (e) => {
      const root = e.target?.closest?.("[data-user-menu]");
      if (!root) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userMenuOpen]);

  // initial load (try session)
  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        // not logged in
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load sheet/meta when game changes
  useEffect(() => {
    (async () => {
      if (!gameId) return;
      try {
        await Promise.all([reloadSheet(), reloadMeta(), reloadPlayers()]);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

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
    setPlayers([]);
    setWinnerUserId(null);
  };

  // ===== Password change =====
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

  // ===== Theme actions =====
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
      setMe((prev) => (prev ? { ...prev, theme_key: key } : prev));
    } catch {
      // ignore; UI already switched
    }
  };

  // ===== Game actions =====
  const newGame = async () => {
    const g = await api("/games", {
      method: "POST",
      body: JSON.stringify({ name: "Spiel " + new Date().toLocaleString() }),
    });
    const gs = await api("/games");
    setGames(gs);
    setGameId(g.id);
  };

  const openJoinModal = () => {
    setJoinOpen(true);
    setUserMenuOpen(false);
  };

  const joinGame = async (code) => {
    const res = await api("/games/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const gs = await api("/games");
    setGames(gs);
    setGameId(res?.game?.id || null);
  };

  // ===== Winner actions (shared per game) =====
  const saveWinner = async () => {
    if (!gameId) return;
    await api(`/games/${gameId}/winner`, {
      method: "PATCH",
      body: JSON.stringify({ winner_user_id: winnerUserId || null }),
    });
    await reloadMeta();
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

    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ note_tag: next }),
    });

    await reloadSheet();
  };

  const chooseChip = async (chip) => {
    if (!chipEntry) return;

    const entry = chipEntry;
    setChipOpen(false);
    setChipEntry(null);

    try {
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: "s", chip_code: chip }),
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

    try {
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: null }),
      });
    } finally {
      await reloadSheet();
    }
  };

  const displayTag = (entry) => {
    const t = entry.note_tag;
    if (!t) return "—";
    if (t === "s") {
      return entry.chip_code ? `s.${entry.chip_code}` : "s";
    }
    return t;
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

  const winnerObj = gameMeta?.winner || null;

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
          openJoinModal={openJoinModal}
          doLogout={doLogout}
          newGame={newGame}
        />

        {me.role === "admin" && <AdminPanel />}

        <GamePickerCard
          games={games}
          gameId={gameId}
          setGameId={setGameId}
          joinCode={currentGame?.join_code || ""}
          onOpenHelp={() => setHelpOpen(true)}
        />

        {winnerObj && <WinnerBadge winnerEmail={winnerObj.email} />}

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

        {/* Sieger (shared per Spiel) */}
        <WinnerCard
          players={players}
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
        onSelect={async (k) => {
          await selectTheme(k);
          setDesignOpen(false);
        }}
      />

      <JoinGameModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={async (code) => {
          await joinGame(code);
          setJoinOpen(false);
        }}
      />

      <ChipModal
        chipOpen={chipOpen}
        closeChipModalToDash={closeChipModalToDash}
        chooseChip={chooseChip}
      />
    </div>
  );
}
