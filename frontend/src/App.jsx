import React, { useEffect, useState } from "react";

const API = "/api";

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function cycleTag(tag) {
  if (!tag) return "i";
  if (tag === "i") return "m";
  if (tag === "m") return "s";
  return null;
}

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

      <div style={{ marginTop: 12, fontWeight: 900, color: "#20140c" }}>
        Vorhandene User
      </div>
      <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
        {users.map((u) => (
          <div key={u.id} style={styles.userRow}>
            <div>{u.email}</div>
            <div style={{ textAlign: "center", fontWeight: 900 }}>{u.role}</div>
            <div style={{ textAlign: "center", opacity: 0.85 }}>
              {u.disabled ? "disabled" : "active"}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div style={styles.modalOverlay} onMouseDown={closeModal}>
          <div
            style={styles.modalCard}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={{ fontWeight: 1000, color: "#20140c" }}>
                Neuen User anlegen
              </div>
              <button
                onClick={closeModal}
                style={styles.modalCloseBtn}
                aria-label="Schließen"
              >
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
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.input}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              {msg && <div style={{ opacity: 0.9 }}>{msg}</div>}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
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

              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Tipp: Klick auf Item: Grün → Rot → Grau → Leer
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  const [helpOpen, setHelpOpen] = useState(false);

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

  // ✅ Google Fonts laden
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
      "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=IM+Fell+English:ital,wght@0,400;0,0.700;1,400&display=swap";

    document.head.appendChild(pre1);
    document.head.appendChild(pre2);
    document.head.appendChild(link);
  }, []);

  // ✅ Keyframes
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

  // ✅ html/body reset
  useEffect(() => {
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.body.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.padding = "0";
    document.documentElement.style.background = "#1c140d";
    document.body.style.background = "#1c140d";
  }, []);

  // ✅ Global CSS (Hover komplett weg + sauberes Scroll-Verhalten)
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
        background: #1c140d;
      }

      body {
        overflow-x: hidden;
        touch-action: pan-y;
        -webkit-overflow-scrolling: touch;
      }

      #root { background: transparent; }

      /* ✅ HOVER/ACTIVE komplett entfernen – Row + alle Children */
      .hp-row:hover,
      .hp-row:active,
      .hp-row:focus,
      .hp-row:focus-within {
        background: inherit !important;
        filter: none !important;
        box-shadow: none !important;
        outline: none !important;
      }

      .hp-row *:hover,
      .hp-row *:active,
      .hp-row *:focus {
        filter: none !important;
        box-shadow: none !important;
        outline: none !important;
      }

      /* ✅ Mobile Tap-Highlight killen (dieser "Flash" schaut oft wie Hover aus) */
      .hp-row, .hp-row * {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-touch-callout: none;
      }

      /* ✅ Button-Default Hover/Active Kill (dein tagBtn & helpBtn etc.) */
      button:hover,
      button:active,
      button:focus {
        filter: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
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

  const toggleTag = async (entry) => {
    const next = cycleTag(entry.note_tag);
    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ note_tag: next }),
    });
    await reloadSheet();
  };

  if (!me) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.bgFixed} aria-hidden="true">
          <div style={styles.bgMap} />
          <div style={styles.bgInkVignette} />
        </div>

        <div style={styles.candleGlowLayer} aria-hidden="true" />

        <div style={styles.loginCard}>
          <div style={styles.loginTitle}>Zauber-Detektiv Notizbogen</div>

          <div style={styles.loginSubtitle}>
            Melde dich an, um dein Cluedo-Magie-Sheet zu öffnen
          </div>

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
            Deine Notizen bleiben privat – jeder Spieler sieht nur seinen eigenen
            Zettel.
          </div>
        </div>
      </div>
    );
  }

  const sections = sheet
    ? [
        {
          key: "suspect",
          title: "VERDÄCHTIGE PERSON",
          entries: sheet.suspect || [],
        },
        { key: "item", title: "GEGENSTAND", entries: sheet.item || [] },
        { key: "location", title: "ORT", entries: sheet.location || [] },
      ]
    : [];

  const getRowBg = (status) => {
    if (status === 1) return "rgba(255, 35, 35, 0.16)";   // rot kräftiger
    if (status === 2) return "rgba(0, 190, 80, 0.16)";    // grün kräftiger
    if (status === 3) return "rgba(80, 80, 80, 0.18)";    // grau kräftiger
    return "rgba(255,255,255,0.14)";                      // neutral
  };

  const getNameColor = (status) => {
    if (status === 1) return "#9f0f0f";
    if (status === 2) return "#0b6a1e";
    if (status === 3) return "#3f3f3f";
    return "#20140c";
  };

  const getStatusSymbol = (status) => {
    if (status === 2) return "✓";
    if (status === 1) return "✕";
    if (status === 3) return "?";
    return "–";
  };

  const getStatusBadge = (status) => {
    if (status === 2)
      return { color: "#0b6a1e", background: "rgba(0,170,60,0.10)" };
    if (status === 1)
      return { color: "#b10000", background: "rgba(255,0,0,0.10)" };
    if (status === 3)
      return { color: "#444444", background: "rgba(120,120,120,0.12)" };
    return {
      color: "rgba(30,20,12,0.60)",
      background: "rgba(255,255,255,0.26)",
    };
  };

  const closeHelp = () => setHelpOpen(false);

  return (
    <div style={styles.page}>
      <div style={styles.bgFixed} aria-hidden="true">
        <div style={styles.bgMap} />
        <div style={styles.bgInkVignette} />
      </div>

      <div style={styles.shell}>
        <div style={styles.topBar}>
          <div>
            <div style={{ fontWeight: 900, color: "#20140c" }}>{me.email}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{me.role}</div>
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

              <button
                onClick={() => setHelpOpen(true)}
                style={styles.helpBtn}
                title="Hilfe"
                aria-label="Hilfe"
              >
                Hilfe
              </button>
            </div>
          </div>
        </div>

        {helpOpen && (
          <div style={styles.modalOverlay} onMouseDown={closeHelp}>
            <div
              style={styles.modalCard}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={{ fontWeight: 1000, color: "#20140c" }}>Hilfe</div>
                <button
                  onClick={closeHelp}
                  style={styles.modalCloseBtn}
                  aria-label="Schließen"
                >
                  ✕
                </button>
              </div>

              <div style={styles.helpBody}>
                <div style={styles.helpSectionTitle}>
                  1) Namen anklicken (Status)
                </div>
                <div style={styles.helpText}>
                  Tippe auf einen Namen, um den Status zu wechseln. Reihenfolge:
                </div>

                <div style={styles.helpList}>
                  <div style={styles.helpListRow}>
                    <span
                      style={{
                        ...styles.helpBadge,
                        background: "rgba(0,170,60,0.12)",
                        color: "#0b6a1e",
                      }}
                    >
                      ✓
                    </span>
                    <div>
                      <b>Grün</b> = bestätigt / fix richtig
                    </div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span
                      style={{
                        ...styles.helpBadge,
                        background: "rgba(255,0,0,0.10)",
                        color: "#b10000",
                      }}
                    >
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
                        background: "rgba(120,120,120,0.14)",
                        color: "#444",
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
                        background: "rgba(255,255,255,0.30)",
                        color: "#20140c",
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

                <div style={styles.helpSectionTitle}>
                  2) i / m / s Button (Notiz)
                </div>
                <div style={styles.helpText}>
                  Rechts pro Zeile gibt es einen Button, der durch diese Werte
                  rotiert:
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
                      <b>s</b> = „Ein anderer Spieler hat diese Karte“
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
                  Tipp: Jeder Spieler sieht nur seine eigenen Notizen – andere
                  Spieler können nicht in deinen Zettel schauen.
                </div>
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
                  const badge = getStatusBadge(e.status);
                  return (
                    <div
                      key={e.entry_id}
                      className="hp-row"
                      style={{
                        ...styles.row,
                        background: getRowBg(e.status),
                        animation:
                          pulseId === e.entry_id
                            ? "rowPulse 220ms ease-out"
                            : "none",
                        borderLeft:
                          e.status === 2 ? "4px solid rgba(0,190,80,0.55)" :
                          e.status === 1 ? "4px solid rgba(255,35,35,0.55)" :
                          e.status === 3 ? "4px solid rgba(90,90,90,0.55)" :
                          "4px solid rgba(0,0,0,0)",
                      }}
                    >
                      <div
                        onClick={() => cycleStatus(e)}
                        style={{
                          ...styles.name,
                          textDecoration:
                            e.status === 1 ? "line-through" : "none",
                          color: getNameColor(e.status),
                          opacity: e.status === 1 ? 0.75 : 1,
                        }}
                        title="Klick: Grün → Rot → Grau → Leer"
                      >
                        {e.label}
                      </div>

                      <div style={styles.statusCell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            color: badge.color,
                            background: badge.background,
                          }}
                        >
                          {getStatusSymbol(e.status)}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleTag(e)}
                        style={styles.tagBtn}
                        title="i → m → s → leer"
                      >
                        {e.note_tag || "—"}
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

/* ===== Styles ===== */
const styles = {
  page: {
    minHeight: "100dvh",
    margin: 0,
    padding: 0,
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
    background: "rgba(255,255,255,0.30)",
    border: "1px solid rgba(0,0,0,0.14)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
    backdropFilter: "blur(4px)",
  },

  card: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.16)",
    background: "rgba(255,255,255,0.26)",
    boxShadow:
      "0 18px 40px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.55)",
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
    color: "rgba(25,16,10,0.95)",
    background:
      "linear-gradient(180deg, rgba(210,170,90,0.95), rgba(150,110,35,0.95))",
    borderBottom: "1px solid rgba(0,0,0,0.22)",
    textTransform: "uppercase",
    textShadow: "0 1px 0 rgba(255,255,255,0.20)",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 54px 68px",
    gap: 10,
    padding: "12px 14px",
    alignItems: "center",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    borderLeft: "4px solid rgba(0,0,0,0)", // default
  },

  name: {
    cursor: "pointer",
    userSelect: "none",
    fontWeight: 800,
    letterSpacing: 0.2,
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
    border: "1px solid rgba(0,0,0,0.22)",
    fontWeight: 1100,
    fontSize: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  },

  tagBtn: {
    padding: "8px 0",
    fontWeight: 1000,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.22)",
    background: "rgba(255,255,255,0.42)",
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  },

  helpBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.22)",
    background: "rgba(255,255,255,0.46)",
    fontWeight: 1000,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.20)",
    background: "rgba(255,255,255,0.55)",
    outline: "none",
    fontSize: 16,
  },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.22)",
    background:
      "linear-gradient(180deg, rgba(246,226,179,0.95), rgba(202,164,90,0.95))",
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  },

  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.20)",
    background: "rgba(255,255,255,0.46)",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  },

  adminWrap: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "rgba(255,255,255,0.22)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
  },
  adminTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  adminTitle: {
    fontWeight: 1000,
    color: "#20140c",
  },
  userRow: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 90px",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.50)",
    border: "1px solid rgba(0,0,0,0.08)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
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
    border: "1px solid rgba(0,0,0,0.25)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    padding: 14,
    backdropFilter: "blur(6px)",
    animation: "popIn 160ms ease-out",
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
    border: "1px solid rgba(0,0,0,0.25)",
    background: "rgba(255,255,255,0.60)",
    fontWeight: 1000,
    cursor: "pointer",
    lineHeight: "38px",
    textAlign: "center",
  },

  helpBody: {
    marginTop: 10,
    paddingTop: 4,
    maxHeight: "70vh",
    overflow: "auto",
  },
  helpSectionTitle: {
    fontWeight: 1000,
    color: "#20140c",
    marginTop: 10,
    marginBottom: 6,
  },
  helpText: {
    color: "#20140c",
    opacity: 0.9,
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
  },
  helpBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
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
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(255,255,255,0.55)",
    fontWeight: 1100,
  },
  helpDivider: {
    margin: "14px 0",
    height: 1,
    background: "rgba(0,0,0,0.12)",
  },

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
    border: "1px solid rgba(0,0,0,0.20)",
    background: "rgba(255,255,255,0.28)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
    backdropFilter: "blur(8px)",
    animation: "popIn 240ms ease-out",
  },
  loginTitle: {
    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
    fontWeight: 1000,
    fontSize: 26,
    color: "#20140c",
    textAlign: "center",
    letterSpacing: 0.6,
  },
  loginSubtitle: {
    marginTop: 6,
    textAlign: "center",
    opacity: 0.85,
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
    border: "1px solid rgba(0,0,0,0.20)",
    background: "rgba(255,255,255,0.55)",
    outline: "none",
    fontSize: 16,
  },
  loginBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.26)",
    background:
      "linear-gradient(180deg, rgba(246,226,179,0.95), rgba(202,164,90,0.95))",
    fontWeight: 1000,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
  },
  loginHint: {
    marginTop: 18,
    fontSize: 13,
    opacity: 0.72,
    textAlign: "center",
    lineHeight: 1.35,
  },

  candleGlowLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: `
      radial-gradient(circle at 20% 25%, rgba(255, 200, 120, 0.22), rgba(0,0,0,0) 40%),
      radial-gradient(circle at 80% 30%, rgba(255, 210, 140, 0.18), rgba(0,0,0,0) 42%),
      radial-gradient(circle at 55% 75%, rgba(255, 180, 100, 0.12), rgba(0,0,0,0) 45%)
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
    border: "1px solid rgba(0,0,0,0.20)",
    background: "rgba(255,255,255,0.55)",
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
    border: "1px solid rgba(0,0,0,0.20)",
    borderLeft: "none",
    background: "rgba(255,255,255,0.60)",
    cursor: "pointer",
    fontWeight: 900,
    padding: 0,
  },

  // ✅ Background (FIXED) — unter Content (zIndex -1) und ohne blur() Filter
  bgFixed: {
    position: "fixed",
    inset: 0,
    zIndex: -1,
    pointerEvents: "none",
  },

  // ✅ WICHTIG: Nutze ein vorab geblurrtes Bild, sonst kriegst du wieder Nähte.
  // Lege ab: /public/bg/marauders-map-blur.jpg
  bgMap: {
    position: "absolute",
    inset: 0,
    backgroundImage: 'url("/bg/marauders-map-blur.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",

    // KEIN blur() hier!
    filter: "saturate(0.95) contrast(1.05) brightness(0.98)",

    // GPU / Seam-Fix
    transform: "translate3d(0,0,0) scale(1.04)",
    willChange: "transform",
    backfaceVisibility: "hidden",

    opacity: 0.95,
  },

  bgInkVignette: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(circle at 50% 45%,
        rgba(0,0,0,0.10) 0%,
        rgba(0,0,0,0.22) 55%,
        rgba(0,0,0,0.55) 82%,
        rgba(0,0,0,0.70) 100%
      ),
      linear-gradient(180deg,
        rgba(245, 226, 185, 0.38),
        rgba(214, 180, 120, 0.28)
      )
    `,
    mixBlendMode: "multiply",
  },
};
