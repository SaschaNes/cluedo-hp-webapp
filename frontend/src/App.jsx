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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={styles.adminTitle}>Admin Dashboard</div>
        <button onClick={() => setOpen(true)} style={styles.primaryBtn}>
          + User anlegen
        </button>
      </div>

      <div style={{ marginTop: 12, fontWeight: 900, color: "#20140c" }}>Vorhandene User</div>
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
          <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ fontWeight: 1000, color: "#20140c" }}>Neuen User anlegen</div>
              <button onClick={closeModal} style={styles.modalCloseBtn} aria-label="Schließen">✕</button>
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

              {msg && <div style={{ opacity: 0.9 }}>{msg}</div>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button onClick={() => { resetForm(); setMsg(""); }} style={styles.secondaryBtn}>
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
  const [loginEmail, setLoginEmail] = useState("admin@local");
  const [loginPassword, setLoginPassword] = useState("");
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [pulseId, setPulseId] = useState(null);

  // ✅ Hilfe Modal State
  const [helpOpen, setHelpOpen] = useState(false);

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "transparent";
  }, []);

  useEffect(() => {
    if (document.getElementById("hp-anim-style")) return;
    const style = document.createElement("style");
    style.id = "hp-anim-style";
    style.innerHTML = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes popIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes rowPulse { 0%{ transform: scale(1); } 50%{ transform: scale(1.01); } 100%{ transform: scale(1); } }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    (async () => {
      try { await load(); } catch {}
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

  // ✅ Cycle: unknown -> green -> red -> gray -> unknown
  const cycleStatus = async (entry) => {
    let next = 0;

    if (entry.status === 0) next = 2;       // grün (✓)
    else if (entry.status === 2) next = 1;  // rot (X)
    else if (entry.status === 1) next = 3;  // grau (?)
    else next = 0;                          // zurück

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
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.title}>Zauber-Detektiv Notizbogen</div>

          <div style={styles.card}>
            <div style={styles.sectionHeader}>Login</div>

            <div style={{ padding: 12, display: "grid", gap: 10 }}>
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                style={styles.input}
              />
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Passwort"
                type="password"
                style={styles.input}
              />
              <button onClick={doLogin} style={styles.primaryBtn}>Anmelden</button>

              <div style={{ opacity: 0.75, fontSize: 13 }}>
                Default Admin: <b>admin@local</b> (Passwort aus <code>.env</code>)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sections = sheet
    ? [
        { key: "suspect", title: "VERDÄCHTIGE PERSON", entries: sheet.suspect || [] },
        { key: "item", title: "GEGENSTAND", entries: sheet.item || [] },
        { key: "location", title: "ORT", entries: sheet.location || [] },
      ]
    : [];

  const getRowBg = (status) => {
    if (status === 1) return "rgba(255, 0, 0, 0.06)";     // rot
    if (status === 2) return "rgba(0, 170, 60, 0.07)";    // grün
    if (status === 3) return "rgba(120, 120, 120, 0.14)"; // grau
    return "rgba(255,255,255,0.22)";
  };

  const getNameColor = (status) => {
    if (status === 1) return "#b10000";
    if (status === 2) return "#0b6a1e";
    if (status === 3) return "#444444";
    return "#20140c";
  };

  const getStatusSymbol = (status) => {
    if (status === 2) return "✓";
    if (status === 1) return "X";
    if (status === 3) return "?";
    return "";
  };

  const getStatusSymbolColor = (status) => {
    if (status === 2) return "#0b6a1e";
    if (status === 1) return "#b10000";
    if (status === 3) return "#444444";
    return "#20140c";
  };

  const closeHelp = () => setHelpOpen(false);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topBar}>
          <div>
            <div style={{ fontWeight: 900, color: "#20140c" }}>{me.email}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{me.role}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={doLogout} style={styles.secondaryBtn}>Logout</button>
            <button onClick={newGame} style={styles.primaryBtn}>+ Neues Spiel</button>
          </div>
        </div>

        {me.role === "admin" && <AdminPanel />}

        {/* Spiel + Hilfe */}
        <div style={{ marginTop: 14 }}>
          <div style={styles.card}>
            <div style={styles.sectionHeader}>Spiel</div>
            <div style={{ padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
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

        {/* Hilfe Modal */}
        {helpOpen && (
          <div style={styles.modalOverlay} onMouseDown={closeHelp}>
            <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ fontWeight: 1000, color: "#20140c" }}>Hilfe</div>
                <button onClick={closeHelp} style={styles.modalCloseBtn} aria-label="Schließen">✕</button>
              </div>

              <div style={styles.helpBody}>
                <div style={styles.helpSectionTitle}>1) Namen anklicken (Status)</div>
                <div style={styles.helpText}>
                  Tippe auf einen Namen, um den Status zu wechseln. Reihenfolge:
                </div>

                <div style={styles.helpList}>
                  <div style={styles.helpListRow}>
                    <span style={{ ...styles.helpBadge, background: "rgba(0,170,60,0.12)", color: "#0b6a1e" }}>✓</span>
                    <div><b>Grün</b> = bestätigt / fix richtig</div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={{ ...styles.helpBadge, background: "rgba(255,0,0,0.10)", color: "#b10000" }}>X</span>
                    <div><b>Rot</b> = ausgeschlossen / fix falsch</div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={{ ...styles.helpBadge, background: "rgba(120,120,120,0.14)", color: "#444" }}>?</span>
                    <div><b>Grau</b> = unsicher / „vielleicht“</div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={{ ...styles.helpBadge, background: "rgba(255,255,255,0.35)", color: "#20140c" }}> </span>
                    <div><b>Leer</b> = unknown / noch nicht bewertet</div>
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
                    <div><b>i</b> = „Ich habe diese Geheimkarte“</div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>m</span>
                    <div><b>m</b> = „Geheimkarte aus dem mittleren Deck“</div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>s</span>
                    <div><b>s</b> = „Ein anderer Spieler hat diese Karte“</div>
                  </div>
                  <div style={styles.helpListRow}>
                    <span style={styles.helpMiniTag}>—</span>
                    <div><b>—</b> = keine Notiz</div>
                  </div>
                </div>

                <div style={styles.helpDivider} />

                <div style={styles.helpText}>

                  Tipp: Jeder Spieler sieht nur seine eigenen Notizen – andere Spieler können nicht in deinen Zettel schauen.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sheet */}
        <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
          {sections.map((sec) => (
            <div key={sec.key} style={styles.card}>
              <div style={styles.sectionHeader}>{sec.title}</div>

              <div style={{ display: "grid" }}>
                {sec.entries.map((e) => (
                  <div
                    key={e.entry_id}
                    style={{
                      ...styles.row,
                      background: getRowBg(e.status),
                      animation:
                        pulseId === e.entry_id
                          ? "rowPulse 220ms ease-out"
                          : "none",
                    }}
                  >
                    <div
                      onClick={() => cycleStatus(e)}
                      style={{
                        ...styles.name,
                        textDecoration: e.status === 1 ? "line-through" : "none",
                        color: getNameColor(e.status),
                        opacity: e.status === 1 ? 0.75 : 1,
                      }}
                      title="Klick: Grün → Rot → Grau → Leer"
                    >
                      {e.label}
                    </div>

                    <div style={{ ...styles.statusCell, color: getStatusSymbolColor(e.status) }}>
                      {getStatusSymbol(e.status)}
                    </div>

                    <button onClick={() => toggleTag(e)} style={styles.tagBtn} title="i → m → s → leer">
                      {e.note_tag || "—"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

/* ===== Styles (Parchment / Boardgame Look) ===== */
const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: 0,
    background:
      `
      radial-gradient(circle at 12% 18%, rgba(120,80,30,0.18), rgba(0,0,0,0) 38%),
      radial-gradient(circle at 85% 22%, rgba(120,80,30,0.12), rgba(0,0,0,0) 42%),
      radial-gradient(circle at 35% 82%, rgba(120,80,30,0.10), rgba(0,0,0,0) 45%),
      radial-gradient(circle at 70% 75%, rgba(90,60,25,0.10), rgba(0,0,0,0) 40%),

      /* subtile Papier-Noise (Pattern) */
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,0.03),
        rgba(255,255,255,0.03) 1px,
        rgba(0,0,0,0.02) 2px,
        rgba(0,0,0,0.02) 3px
      ),

      /* Grundfarbe Pergament */
      linear-gradient(180deg, #f1e2c2, #e3c996)
      `,
    backgroundAttachment: "fixed",
  },
  shell: {
    fontFamily: '"IM Fell English", system-ui',
    padding: 16,
    maxWidth: 620,
    margin: "0 auto",
  },
  title: {
    fontWeight: 1000,
    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
    letterSpacing: 0.5,
    fontSize: 22,
    color: "#20140c",
    marginBottom: 12,
    textShadow: "0 1px 0 rgba(255,255,255,0.35)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255,255,255,0.35)",
    border: "1px solid rgba(0,0,0,0.15)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
    backdropFilter: "blur(4px)",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(255,255,255,0.35)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  sectionHeader: {
    padding: "10px 12px",
    fontWeight: 1000,
    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
    letterSpacing: 0.7,
    color: "#2b1a0e",
    background: "linear-gradient(180deg, #caa45a, #a67a2a)",
    borderBottom: "1px solid rgba(0,0,0,0.25)",
    textTransform: "uppercase",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 46px 56px",
    gap: 8,
    padding: "10px 12px",
    alignItems: "center",
    borderBottom: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.22)",
  },
  name: {
    cursor: "pointer",
    userSelect: "none",
    color: "#20140c",
    fontWeight: 700,
  },
  statusCell: {
    textAlign: "center",
    fontWeight: 1100,
    fontSize: 18,
  },
  tagBtn: {
    padding: "8px 0",
    fontWeight: 1000,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(0,0,0,0.06))",
    cursor: "pointer",
  },
  helpBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(0,0,0,0.06))",
    fontWeight: 1000,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "rgba(255,255,255,0.55)",
    outline: "none",
  },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, #f3d79b, #caa45a)",
    fontWeight: 1000,
    cursor: "pointer",
    transition: "transform 140ms ease, box-shadow 140ms ease",
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(0,0,0,0.05))",
    fontWeight: 900,
    cursor: "pointer",
    transition: "transform 140ms ease, box-shadow 140ms ease",
  },
  adminWrap: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(255,255,255,0.30)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
  },
  adminTitle: {
    fontWeight: 1000,
    color: "#20140c",
    marginBottom: 8,
  },
  userRow: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 90px",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(0,0,0,0.10)",
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
    background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
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
    background: "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(0,0,0,0.06))",
    fontWeight: 1000,
    cursor: "pointer",
    lineHeight: "38px",
    textAlign: "center",
  },

  // Help modal content
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
};
