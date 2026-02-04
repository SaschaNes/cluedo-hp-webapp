import React, { useEffect, useState } from "react";
import { api } from "./api/client";
import { cycleTag } from "./utils/cycleTag";
import { getChipLS, setChipLS, clearChipLS } from "./utils/chipStorage";
import { useHpGlobalStyles } from "./styles/hooks/useHpGlobalStyles";
import { styles } from "./styles/styles";
import { stylesTokens } from "./styles/theme";

import AdminPanel from "./components/AdminPanel";
import LoginPage from "./components/LoginPage";
import TopBar from "./components/TopBar";
import PasswordModal from "./components/PasswordModal";
import ChipModal from "./components/ChipModal";
// HelpModal + SheetSection würdest du analog auslagern

export default function App() {
  useHpGlobalStyles();

  const [me, setMe] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  const [chipOpen, setChipOpen] = useState(false);
  const [chipEntry, setChipEntry] = useState(null);

  const [helpOpen, setHelpOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
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

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!gameId) return;
      try {
        const sh = await api(`/games/${gameId}/sheet`);
        setSheet(sh);
      } catch {}
    })();
  }, [gameId]);

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

  // Password change
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

  const newGame = async () => {
    const g = await api("/games", {
      method: "POST",
      body: JSON.stringify({ name: "Spiel " + new Date().toLocaleString() }),
    });
    const gs = await api("/games");
    setGames(gs);
    setGameId(g.id);
  };

  const reloadSheet = async () => {
    if (!gameId) return;
    const sh = await api(`/games/${gameId}/sheet`);
    setSheet(sh);
  };

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
      body: JSON.stringify({ note_tag: next }),
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

        {/* hier bleiben vorerst: Spiel selector + Help + Sections
            -> kannst du als nächsten Schritt in Komponenten auslagern */}
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

      <ChipModal chipOpen={chipOpen} closeChipModalToDash={closeChipModalToDash} chooseChip={chooseChip} />
    </div>
  );
}
