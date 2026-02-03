import React, { useEffect, useState } from "react";

const API = "/api";
const CHIP_LIST = ["AL", "JG", "JN", "SN", "TL"];

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Backend erlaubt: null | "i" | "m" | "s"
 * Rotation:
 * null -> i -> m -> s (Popup) -> null
 */
function cycleTag(tag) {
  if (!tag) return "i";
  if (tag === "i") return "m";
  if (tag === "m") return "s";
  return null; // "s" -> null
}

/* ========= Chip localStorage (Frontend-only) ========= */
function chipStorageKey(gameId, entryId) {
  return `chip:${gameId}:${entryId}`;
}

function getChipLS(gameId, entryId) {
  try {
    return localStorage.getItem(chipStorageKey(gameId, entryId));
  } catch {
    return null;
  }
}

function setChipLS(gameId, entryId, chip) {
  try {
    localStorage.setItem(chipStorageKey(gameId, entryId), chip);
  } catch {}
}

function clearChipLS(gameId, entryId) {
  try {
    localStorage.removeItem(chipStorageKey(gameId, entryId));
  } catch {}
}

/* ========= Admin Panel ========= */
function AdminPanel() {
  const [users, setUsers] = useState([]);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [msg, setMsg] = useState("");

  const loadUsers = async () => {
    const u = await api("/admin/users");
    setUsers(u);
  };

  useEffect(() => {
    loadUsers().catch(() => {});
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const createUser = async () => {
    setMsg("");
    try {
      await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
      setMsg("✅ User erstellt.");
      await loadUsers();
      resetForm();
      setOpen(false);
    } catch (e) {
      setMsg("❌ Fehler: " + (e?.message || "unknown"));
    }
  };

  const closeModal = () => {
    setOpen(false);
    setMsg("");
  };

  return (
    <div style={styles.adminWrap}>
      <div style={styles.adminTop}>
        <div style={styles.adminTitle}>Admin Dashboard</div>
        <button onClick={() => setOpen(true)} style={styles.primaryBtn}>
          + User anlegen
        </button>
      </div>

      <div style={{ marginTop: 12, fontWeight: 900, color: stylesTokens.textGold }}>
        Vorhandene User
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
        {users.map((u) => (
          <div key={u.id} style={styles.userRow}>
            <div style={{ color: stylesTokens.textMain }}>{u.email}</div>
            <div style={{ textAlign: "center", fontWeight: 900, color: stylesTokens.textGold }}>
              {u.role}
            </div>
            <div style={{ textAlign: "center", opacity: 0.85, color: stylesTokens.textMain }}>
              {u.disabled ? "disabled" : "active"}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div style={styles.modalOverlay} onMouseDown={closeModal}>
          <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>
                Neuen User anlegen
              </div>
              <button onClick={closeModal} style={styles.modalCloseBtn} aria-label="Schließen">
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={styles.input}
                autoFocus
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial Passwort"
                type="password"
                style={styles.input}
              />
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              {msg && <div style={{ opacity: 0.9, color: stylesTokens.textMain }}>{msg}</div>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  onClick={() => {
                    resetForm();
                    setMsg("");
                  }}
                  style={styles.secondaryBtn}
                >
                  Leeren
                </button>
                <button onClick={createUser} style={styles.primaryBtn}>
                  User erstellen
                </button>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
                Tipp: Klick auf Item: Grün → Rot → Grau → Leer
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= App ========= */
export default function App() {
  const [me, setMe] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  // Chip popup
  const [chipOpen, setChipOpen] = useState(false);
  const [chipEntry, setChipEntry] = useState(null);

  const [helpOpen, setHelpOpen] = useState(false);

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

  // Google Fonts
  useEffect(() => {
    if (document.getElementById("hp-fonts")) return;

    const pre1 = document.createElement("link");
    pre1.id = "hp-fonts-pre1";
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";

    const pre2 = document.createElement("link");
    pre2.id = "hp-fonts-pre2";
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";

    const link = document.createElement("link");
    link.id = "hp-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=IM+Fell+English:ital,wght@0,400;0,700;1,400&display=swap";

    document.head.appendChild(pre1);
    document.head.appendChild(pre2);
    document.head.appendChild(link);
  }, []);

  // Keyframes
  useEffect(() => {
    if (document.getElementById("hp-anim-style")) return;
    const style = document.createElement("style");
    style.id = "hp-anim-style";
    style.innerHTML = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes popIn { from { opacity: 0; transform: translateY(8px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes rowPulse { 0%{ transform: scale(1); } 50%{ transform: scale(1.01); } 100%{ transform: scale(1); } }
      @keyframes candleGlow {
        0%   { opacity: .55; transform: translateY(0px) scale(1); filter: blur(16px); }
        35%  { opacity: .85; transform: translateY(-2px) scale(1.02); filter: blur(18px); }
        70%  { opacity: .62; transform: translateY(1px) scale(1.01); filter: blur(17px); }
        100% { opacity: .55; transform: translateY(0px) scale(1); filter: blur(16px); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // html/body reset
  useEffect(() => {
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.body.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.padding = "0";
  }, []);

  // Global CSS
  useEffect(() => {
    if (document.getElementById("hp-global-style")) return;
    const style = document.createElement("style");
    style.id = "hp-global-style";
    style.innerHTML = `
      html, body {
        overscroll-behavior-y: none;
        -webkit-text-size-adjust: 100%;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: ${stylesTokens.pageBg};
        color: ${stylesTokens.textMain};
      }
      body {
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }
      #root { background: transparent; }
      * { -webkit-tap-highlight-color: transparent; }
    `;
    document.head.appendChild(style);
  }, []);

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

  useEffect(() => {
    (async () => {
      if (!gameId) return;
      try {
        const sh = await api(`/games/${gameId}/sheet`);
        setSheet(sh);
      } catch {
        // ignore
      }
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

  // Notiz-Button: i -> m -> (Popup) s -> null
  const toggleTag = async (entry) => {
    const next = cycleTag(entry.note_tag);

    // Wenn wir zu "s" gehen würden -> Chip Popup öffnen, aber NICHT ins Backend schreiben
    if (next === "s") {
      setChipEntry(entry);
      setChipOpen(true);
      return;
    }

    // Wenn wir auf null gehen, Chip lokal löschen (weil s -> —)
    if (next === null) {
      clearChipLS(gameId, entry.entry_id);
    }

    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ note_tag: next }),
    });
    await reloadSheet();
  };

  // Chip wählen:
  // Backend: note_tag = "s"
  // Frontend: Chip in localStorage
  const chooseChip = async (chip) => {
    if (!chipEntry) return;

    // UI sofort schließen -> fühlt sich besser an
    const entry = chipEntry;
    setChipOpen(false);
    setChipEntry(null);

    // local speichern
    setChipLS(gameId, entry.entry_id, chip);

    try {
      // Backend bekommt nur "s"
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: "s" }),
      });
    } finally {
      await reloadSheet();
    }
  };

  // X im Modal:
  // Backend zurück auf null und lokalen Chip löschen
  const closeChipModalToDash = async () => {
    if (!chipEntry) {
      setChipOpen(false);
      return;
    }

    // UI sofort schließen
    const entry = chipEntry;
    setChipOpen(false);
    setChipEntry(null);

    // Frontend-only Chip entfernen
    clearChipLS(gameId, entry.entry_id);

    try {
      // Backend zurück auf —
      await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
        method: "PATCH",
        body: JSON.stringify({ note_tag: null }),
      });
    } finally {
      await reloadSheet();
    }
  };

  // Anzeige im Tag-Button:
  // - "s" wird zu "s.AL" (aus localStorage), sonst "s"
  const displayTag = (entry) => {
    const t = entry.note_tag;
    if (!t) return "—";

    if (t === "s") {
      const chip = getChipLS(gameId, entry.entry_id);
      return chip ? `s.${chip}` : "s"; // <-- genau wie gewünscht
    }

    return t; // i oder m
  };

  // --- helpers ---
  const getRowBg = (status) => {
    if (status === 1) return "rgba(255, 35, 35, 0.16)";
    if (status === 2) return "rgba(0, 190, 80, 0.16)";
    if (status === 3) return "rgba(140, 140, 140, 0.12)";
    return "rgba(255,255,255,0.06)";
  };

  const getNameColor = (status) => {
    if (status === 1) return "#ffb3b3";
    if (status === 2) return "#baf3c9";
    if (status === 3) return "rgba(233,216,166,0.78)";
    return stylesTokens.textMain;
  };

  const getStatusSymbol = (status) => {
    if (status === 2) return "✓";
    if (status === 1) return "✕";
    if (status === 3) return "?";
    return "–";
  };

  const getStatusBadge = (status) => {
    if (status === 2) return { color: "#baf3c9", background: "rgba(0,190,80,0.18)" };
    if (status === 1) return { color: "#ffb3b3", background: "rgba(255,35,35,0.18)" };
    if (status === 3)
      return { color: "rgba(233,216,166,0.85)", background: "rgba(140,140,140,0.14)" };
    return { color: "rgba(233,216,166,0.75)", background: "rgba(255,255,255,0.08)" };
  };

  const closeHelp = () => setHelpOpen(false);

  // ===== Login =====
  if (!me) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.bgFixed} aria-hidden="true">
          <div style={styles.bgMap} />
        </div>

        <div style={styles.candleGlowLayer} aria-hidden="true" />

        <div style={styles.loginCard}>
          <div style={styles.loginTitle}>Zauber-Detektiv Notizbogen</div>

          <div style={styles.loginSubtitle}>Melde dich an, um dein Cluedo-Magie-Sheet zu öffnen</div>

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div style={styles.loginFieldWrap}>
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                style={styles.loginInput}
                inputMode="email"
                autoComplete="username"
              />
            </div>

            <div style={styles.loginFieldWrap}>
              <div style={styles.inputRow}>
                <input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Passwort"
                  type={showPw ? "text" : "password"}
                  style={styles.inputInRow}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={styles.pwToggleBtn}
                  aria-label={showPw ? "Passwort verstecken" : "Passwort anzeigen"}
                  title={showPw ? "Verstecken" : "Anzeigen"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button onClick={doLogin} style={styles.loginBtn}>
              ✦ Anmelden
            </button>
          </div>

          <div style={styles.loginHint}>
            Deine Notizen bleiben privat – jeder Spieler sieht nur seinen eigenen Zettel.
          </div>
        </div>
      </div>
    );
  }

  // ===== Main =====
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
        <div style={styles.topBar}>
          <div>
            <div style={{ fontWeight: 900, color: stylesTokens.textGold }}>{me.email}</div>
            <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>{me.role}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={doLogout} style={styles.secondaryBtn}>
              Logout
            </button>
            <button onClick={newGame} style={styles.primaryBtn}>
              + Neues Spiel
            </button>
          </div>
        </div>

        {me.role === "admin" && <AdminPanel />}

        <div style={{ marginTop: 14 }}>
          <div style={styles.card}>
            <div style={styles.sectionHeader}>Spiel</div>
            <div style={styles.cardBody}>
              <select
                value={gameId || ""}
                onChange={(e) => setGameId(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <button onClick={() => setHelpOpen(true)} style={styles.helpBtn} title="Hilfe">
                Hilfe
              </button>
            </div>
          </div>
        </div>

        {helpOpen && (
          <div style={styles.modalOverlay} onMouseDown={closeHelp}>
            <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Hilfe</div>
                <button onClick={closeHelp} style={styles.modalCloseBtn} aria-label="Schließen">
                  ✕
                </button>
              </div>

              <div style={styles.helpBody}>
                <div style={styles.helpSectionTitle}>1) Namen anklicken (Status)</div>
                <div style={styles.helpText}>
                  Tippe auf einen Namen, um den Status zu wechseln. Reihenfolge:
                </div>

                <div style={styles.helpList}>
                  <div style={styles.helpListRow}>
                    <span style={{ ...styles.helpBadge, background: "rgba(0,190,80,0.18)", color: "#baf3c9" }}>
                      ✓
                    </span>
                    <div>
                      <b>Grün</b> = bestätigt / fix richtig
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={{ ...styles.helpBadge, background: "rgba(255,35,35,0.18)", color: "#ffb3b3" }}>
                      ✕
                    </span>
                    <div>
                      <b>Rot</b> = ausgeschlossen / fix falsch
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span
                      style={{
                        ...styles.helpBadge,
                        background: "rgba(140,140,140,0.14)",
                        color: "rgba(233,216,166,0.85)",
                      }}
                    >
                      ?
                    </span>
                    <div>
                      <b>Grau</b> = unsicher / „vielleicht“
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span
                      style={{
                        ...styles.helpBadge,
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(233,216,166,0.75)",
                      }}
                    >
                      –
                    </span>
                    <div>
                      <b>Leer</b> = unknown / noch nicht bewertet
                    </div>
                  </div>
                </div>

                <div style={styles.helpDivider} />

                <div style={styles.helpSectionTitle}>2) i / m / s Button (Notiz)</div>
                <div style={styles.helpText}>
                  Rechts pro Zeile gibt es einen Button, der durch diese Werte rotiert:
                </div>

                <div style={styles.helpList}>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>i</span>
                    <div>
                      <b>i</b> = „Ich habe diese Geheimkarte“
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>m</span>
                    <div>
                      <b>m</b> = „Geheimkarte aus dem mittleren Deck“
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>s</span>
                    <div>
                      <b>s</b> = „Ein anderer Spieler hat diese Karte“ (Chip Auswahl)
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>—</span>
                    <div>
                      <b>—</b> = keine Notiz
                    </div>
                  </div>
                </div>

                <div style={styles.helpDivider} />

                <div style={styles.helpText}>
                  Tipp: Jeder Spieler sieht nur seine eigenen Notizen – andere Spieler können nicht in deinen
                  Zettel schauen.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chip Popup */}
        {chipOpen && (
          <div style={styles.modalOverlay} onMouseDown={closeChipModalToDash}>
            <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Wer hat die Karte?</div>
                <button onClick={closeChipModalToDash} style={styles.modalCloseBtn} aria-label="Schließen">
                  ✕
                </button>
              </div>

              <div style={{ marginTop: 12, color: stylesTokens.textMain }}>Chip auswählen:</div>

              <div style={styles.chipGrid}>
                {CHIP_LIST.map((c) => (
                  <button key={c} onClick={() => chooseChip(c)} style={styles.chipBtn}>
                    {c}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: stylesTokens.textDim }}>
                Tipp: Wenn du wieder auf den Notiz-Button klickst, geht’s von <b>s.XX</b> zurück auf —.
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
          {sections.map((sec) => (
            <div key={sec.key} style={styles.card}>
              <div style={styles.sectionHeader}>{sec.title}</div>

              <div style={{ display: "grid" }}>
                {sec.entries.map((e) => {
                  // UI "rot" wenn note_tag i oder s (Backend s wird als s.XX angezeigt)
                  const isIorMorS = e.note_tag === "i" || e.note_tag === "m" || e.note_tag === "s";
                  const effectiveStatus = e.status === 0 && isIorMorS ? 1 : e.status;

                  const badge = getStatusBadge(effectiveStatus);

                  return (
                    <div
                      key={e.entry_id}
                      className="hp-row"
                      style={{
                        ...styles.row,
                        background: getRowBg(effectiveStatus),
                        animation: pulseId === e.entry_id ? "rowPulse 220ms ease-out" : "none",
                        borderLeft:
                          effectiveStatus === 2
                            ? "4px solid rgba(0,190,80,0.55)"
                            : effectiveStatus === 1
                            ? "4px solid rgba(255,35,35,0.55)"
                            : effectiveStatus === 3
                            ? "4px solid rgba(233,216,166,0.22)"
                            : "4px solid rgba(0,0,0,0)",
                      }}
                    >
                      <div
                        onClick={() => cycleStatus(e)}
                        style={{
                          ...styles.name,
                          textDecoration: effectiveStatus === 1 ? "line-through" : "none",
                          color: getNameColor(effectiveStatus),
                          opacity: effectiveStatus === 1 ? 0.8 : 1,
                        }}
                        title="Klick: Grün → Rot → Grau → Leer"
                      >
                        {e.label}
                      </div>

                      <div style={styles.statusCell}>
                        <span style={{ ...styles.statusBadge, color: badge.color, background: badge.background }}>
                          {getStatusSymbol(effectiveStatus)}
                        </span>
                      </div>

                      <button onClick={() => toggleTag(e)} style={styles.tagBtn} title="— → i → m → s.(Chip) → —">
                        {displayTag(e)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

/* ===== Theme Tokens ===== */
const stylesTokens = {
  pageBg: "#0b0b0c",
  panelBg: "rgba(20, 20, 22, 0.55)",
  panelBorder: "rgba(233, 216, 166, 0.14)",

  textMain: "rgba(245, 239, 220, 0.92)",
  textDim: "rgba(233, 216, 166, 0.70)",
  textGold: "#e9d8a6",

  goldLine: "rgba(233, 216, 166, 0.18)",
};

/* ===== Styles ===== */
const styles = {
  page: {
    minHeight: "100dvh",
    background: "transparent",
    position: "relative",
    zIndex: 1,
  },

  shell: {
    fontFamily: '"IM Fell English", system-ui',
    padding: 16,
    maxWidth: 680,
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    background: stylesTokens.panelBg,
    border: `1px solid ${stylesTokens.panelBorder}`,
    boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
  },

  card: {
    borderRadius: 18,
    overflow: "hidden",
    border: `1px solid ${stylesTokens.panelBorder}`,
    background: "rgba(18, 18, 20, 0.50)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  cardBody: {
    padding: 12,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  sectionHeader: {
    padding: "11px 14px",
    fontWeight: 1000,
    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
    letterSpacing: 1.0,
    color: stylesTokens.textGold,
    background: "linear-gradient(180deg, rgba(32,32,36,0.92), rgba(14,14,16,0.92))",
    borderBottom: `1px solid ${stylesTokens.goldLine}`,
    textTransform: "uppercase",
    textShadow: "0 1px 0 rgba(0,0,0,0.6)",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 54px 68px",
    gap: 10,
    padding: "12px 14px",
    alignItems: "center",
    borderBottom: "1px solid rgba(233,216,166,0.08)",
    borderLeft: "4px solid rgba(0,0,0,0)",
  },

  name: {
    cursor: "pointer",
    userSelect: "none",
    fontWeight: 800,
    letterSpacing: 0.2,
    color: stylesTokens.textMain,
  },

  statusCell: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  statusBadge: {
    width: 34,
    height: 34,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    border: `1px solid rgba(233,216,166,0.18)`,
    fontWeight: 1100,
    fontSize: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  tagBtn: {
    padding: "8px 0",
    fontWeight: 1000,
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(255,255,255,0.06)",
    color: stylesTokens.textGold,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  helpBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(255,255,255,0.06)",
    color: stylesTokens.textGold,
    fontWeight: 1000,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(10,10,12,0.55)",
    color: stylesTokens.textMain,
    outline: "none",
    fontSize: 16,
  },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.28)`,
    background: "linear-gradient(180deg, rgba(233,216,166,0.24), rgba(233,216,166,0.10))",
    color: stylesTokens.textGold,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  },

  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(255,255,255,0.05)",
    color: stylesTokens.textMain,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },

  // Admin
  adminWrap: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    border: `1px solid rgba(233,216,166,0.14)`,
    background: "rgba(18, 18, 20, 0.40)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
  },
  adminTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  adminTitle: {
    fontWeight: 1000,
    color: stylesTokens.textGold,
  },
  userRow: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 90px",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid rgba(233,216,166,0.10)`,
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
    animation: "fadeIn 160ms ease-out",
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 18,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "linear-gradient(180deg, rgba(20,20,24,0.92), rgba(12,12,14,0.86))",
    boxShadow: "0 18px 55px rgba(0,0,0,0.70)",
    padding: 14,
    backdropFilter: "blur(6px)",
    animation: "popIn 160ms ease-out",
    color: stylesTokens.textMain,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(255,255,255,0.06)",
    color: stylesTokens.textGold,
    fontWeight: 1000,
    cursor: "pointer",
    lineHeight: "38px",
    textAlign: "center",
  },

  // Help
  helpBody: {
    marginTop: 10,
    paddingTop: 4,
    maxHeight: "70vh",
    overflow: "auto",
  },
  helpSectionTitle: {
    fontWeight: 1000,
    color: stylesTokens.textGold,
    marginTop: 10,
    marginBottom: 6,
  },
  helpText: {
    color: stylesTokens.textMain,
    opacity: 0.92,
    lineHeight: 1.35,
  },
  helpList: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },
  helpListRow: {
    display: "grid",
    gridTemplateColumns: "42px 1fr",
    gap: 10,
    alignItems: "center",
    color: stylesTokens.textMain,
  },
  helpBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    fontWeight: 1100,
    fontSize: 18,
  },
  helpMiniTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(255,255,255,0.06)",
    color: stylesTokens.textGold,
    fontWeight: 1100,
  },
  helpDivider: {
    margin: "14px 0",
    height: 1,
    background: "rgba(233,216,166,0.12)",
  },

  // Login
  loginPage: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: 20,
    background: "transparent",
    zIndex: 1,
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    padding: 26,
    borderRadius: 22,
    position: "relative",
    zIndex: 2,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(18, 18, 20, 0.55)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.70)",
    backdropFilter: "blur(8px)",
    animation: "popIn 240ms ease-out",
    color: stylesTokens.textMain,
  },
  loginTitle: {
    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
    fontWeight: 1000,
    fontSize: 26,
    color: stylesTokens.textGold,
    textAlign: "center",
    letterSpacing: 0.6,
  },
  loginSubtitle: {
    marginTop: 6,
    textAlign: "center",
    color: stylesTokens.textMain,
    opacity: 0.9,
    fontSize: 15,
    lineHeight: 1.4,
  },
  loginFieldWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  loginInput: {
    width: "100%",
    padding: 10,
    borderRadius: 12,
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(10,10,12,0.60)",
    color: stylesTokens.textMain,
    outline: "none",
    fontSize: 16,
  },
  loginBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid rgba(233,216,166,0.28)`,
    background: "linear-gradient(180deg, rgba(233,216,166,0.24), rgba(233,216,166,0.10))",
    color: stylesTokens.textGold,
    fontWeight: 1000,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  loginHint: {
    marginTop: 18,
    fontSize: 13,
    opacity: 0.78,
    textAlign: "center",
    color: stylesTokens.textDim,
    lineHeight: 1.35,
  },

  candleGlowLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: `
      radial-gradient(circle at 20% 25%, rgba(255, 200, 120, 0.16), rgba(0,0,0,0) 40%),
      radial-gradient(circle at 80% 30%, rgba(255, 210, 140, 0.12), rgba(0,0,0,0) 42%),
      radial-gradient(circle at 55% 75%, rgba(255, 180, 100, 0.08), rgba(0,0,0,0) 45%)
    `,
    animation: "candleGlow 3.8s ease-in-out infinite",
    mixBlendMode: "multiply",
  },

  inputRow: {
    display: "flex",
    alignItems: "stretch",
    width: "100%",
  },
  inputInRow: {
    flex: 1,
    padding: 10,
    borderRadius: "12px 0 0 12px",
    border: `1px solid rgba(233,216,166,0.18)`,
    background: "rgba(10,10,12,0.60)",
    color: stylesTokens.textMain,
    outline: "none",
    minWidth: 0,
    fontSize: 16,
  },
  pwToggleBtn: {
    width: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0 12px 12px 0",
    border: `1px solid rgba(233,216,166,0.18)`,
    borderLeft: "none",
    background: "rgba(255,255,255,0.06)",
    color: stylesTokens.textGold,
    cursor: "pointer",
    fontWeight: 900,
    padding: 0,
  },

  // Background
  bgFixed: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100dvh",
    zIndex: -1,
    pointerEvents: "none",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    willChange: "transform",
  },

  bgMap: {
    position: "absolute",
    inset: 0,
    backgroundImage: 'url("/bg/marauders-map-blur.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: "saturate(0.9) contrast(1.05) brightness(0.55)",
  },

  chipGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 8,
  },

  chipBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(233,216,166,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: stylesTokens.textGold,
    fontWeight: 1000,
    cursor: "pointer",
    minWidth: 64,
  },
};
