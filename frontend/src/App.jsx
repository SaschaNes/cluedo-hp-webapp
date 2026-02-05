// src/App.jsx
import React, { useEffect, useState } from "react";

import { api } from "./api/client";
import { cycleTag } from "./utils/cycleTag";
import { getChipLS, setChipLS, clearChipLS } from "./utils/chipStorage";
import { useHpGlobalStyles } from "./styles/hooks/useHpGlobalStyles";
import { styles } from "./styles/styles";

import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import TopBar from "./components/TopBar";
import PasswordModal from "./components/PasswordModal";
import ChipModal from "./components/ChipModal";
import HelpModal from "./components/HelpModal";
import GamePickerCard from "./components/GamePickerCard";
import SheetSection from "./components/SheetSection";

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

  // ===== Data loaders =====
  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

  const reloadSheet = async () => {
    if (!gameId) return;
    const sh = await api(`/games/${gameId}/sheet`);
    setSheet(sh);
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

  // load sheet when game changes
  useEffect(() => {
    (async () => {
      if (!gameId) return;
      try {
        await reloadSheet();
      } catch {
        // ignore
      }
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

    // going to "s" -> open chip modal, don't write backend yet
    if (next === "s") {
      setChipEntry(entry);
      setChipOpen(true);
      return;
    }

    // s -> — : clear local chip
    if (next === null) clearChipLS(gameId, entry.entry_id);

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

    // frontend-only save
    setChipLS(gameId, entry.entry_id, chip);

    try {
      // backend only gets "s"
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: "s" }),
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
      const chip = getChipLS(gameId, entry.entry_id);
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
          doLogout={doLogout}
          newGame={newGame}
        />

        {me.role === "admin" && <AdminPanel />}

        <GamePickerCard
          games={games}
          gameId={gameId}
          setGameId={setGameId}
          onOpenHelp={() => setHelpOpen(true)}
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

      <ChipModal
        chipOpen={chipOpen}
        closeChipModalToDash={closeChipModalToDash}
        chooseChip={chooseChip}
      />
    </div>
  );
}
