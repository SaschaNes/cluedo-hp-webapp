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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 1000, color: "#20140c" }}>Neuen User anlegen</div>
              <button onClick={closeModal} style={styles.secondaryBtn}>Schließen</button>
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
                Tipp: Tap auf Item = rot (ausschließen), Long-Press = grün (bestätigt), ? = unsicher.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useLongPress(onLongPress, onClick, { delay = 450 } = {}) {
  const [longPressed, setLongPressed] = useState(false);
  const timeoutRef = React.useRef(null);

  const start = (e) => {
    e.preventDefault();
    setLongPressed(false);
    timeoutRef.current = setTimeout(() => {
      setLongPressed(true);
      onLongPress();
    }, delay);
  };

  const clear = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const end = () => {
    clear();
    if (!longPressed) onClick();
  };

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchMove: clear,
  };
}

export default function App() {
  const [me, setMe] = useState(null);
  const [loginEmail, setLoginEmail] = useState("admin@local");
  const [loginPassword, setLoginPassword] = useState("");
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);

  const load = async () => {
    const m = await api("/auth/me");
    setMe(m);

    const gs = await api("/games");
    setGames(gs);

    if (gs[0] && !gameId) setGameId(gs[0].id);
  };

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

  const toggleCross = async (entry) => {
    const next = entry.status === 1 ? 0 : 1;
    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await reloadSheet();
  };

  const toggleConfirmed = async (entry) => {
    const next = entry.status === 2 ? 0 : 2;
    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await reloadSheet();
  };

  const toggleMaybe = async (entry) => {
    const next = entry.status === 3 ? 0 : 3;
    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await reloadSheet();
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
    if (status === 1) return "rgba(255, 0, 0, 0.06)";     // crossed
    if (status === 2) return "rgba(0, 170, 60, 0.07)";    // confirmed
    if (status === 3) return "rgba(255, 180, 70, 0.12)";  // maybe
    return "rgba(255,255,255,0.22)";
  };

  const getNameColor = (status) => {
    if (status === 1) return "#b10000";
    if (status === 2) return "#0b6a1e";
    if (status === 3) return "#6b4d00";
    return "#20140c";
  };

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

        <div style={{ marginTop: 14 }}>
          <div style={styles.card}>
            <div style={styles.sectionHeader}>Spiel</div>
            <div style={{ padding: 12 }}>
              <select
                value={gameId || ""}
                onChange={(e) => setGameId(e.target.value)}
                style={styles.input}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
          {sections.map((sec) => (
            <div key={sec.key} style={styles.card}>
              <div style={styles.sectionHeader}>{sec.title}</div>

              <div style={{ display: "grid" }}>
                {sec.entries.map((e) => {
                  const pressHandlers = useLongPress(
                    () => toggleConfirmed(e), // long press -> confirmed
                    () => toggleCross(e),     // tap -> crossed
                    { delay: 450 }
                  );

                  return (
                    <div
                      key={e.entry_id}
                      style={{
                        ...styles.row,
                        background: getRowBg(e.status),
                      }}
                    >
                      {/* Name: Tap = rot, Long-Press = grün */}
                      <div
                        {...pressHandlers}
                        style={{
                          ...styles.name,
                          textDecoration: e.status === 1 ? "line-through" : "none",
                          color: getNameColor(e.status),
                          opacity: e.status === 1 ? 0.75 : 1,
                        }}
                        title="Tippen = ausschließen | Lange halten = bestätigt"
                      >
                        {e.label}
                      </div>

                      {/* ? = maybe */}
                      <button
                        onClick={() => toggleMaybe(e)}
                        style={{
                          ...styles.maybeBtn,
                          background: e.status === 3
                            ? "linear-gradient(180deg, rgba(255,210,120,0.9), rgba(180,120,20,0.25))"
                            : styles.maybeBtn.background,
                        }}
                        title="Unsicher"
                      >
                        ?
                      </button>

                      <div style={styles.cell}>{e.status === 1 ? "X" : ""}</div>
                      <div style={styles.cell}>{e.status === 1 ? "✓" : ""}</div>
                      <div style={styles.cell}>{e.status === 2 ? "✓" : ""}</div>

                      <button onClick={() => toggleTag(e)} style={styles.tagBtn} title="i → m → s → leer">
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

/* ===== Styles (Parchment / Boardgame Look) ===== */
const styles = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background:
      "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.40), rgba(0,0,0,0) 45%), linear-gradient(180deg, #f3e7cf, #e5d2ac)",
  },
  shell: {
    fontFamily: "system-ui",
    maxWidth: 620,
    margin: "0 auto",
  },
  title: {
    fontWeight: 1000,
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
  },
  sectionHeader: {
    padding: "10px 12px",
    fontWeight: 1000,
    letterSpacing: 0.7,
    color: "#2b1a0e",
    background: "linear-gradient(180deg, #caa45a, #a67a2a)",
    borderBottom: "1px solid rgba(0,0,0,0.25)",
    textTransform: "uppercase",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 42px 40px 40px 40px 56px", // ✅ extra Spalte für ?
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
  cell: {
    textAlign: "center",
    fontWeight: 1000,
    color: "#20140c",
  },
  maybeBtn: {
    padding: "8px 0",
    fontWeight: 1000,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(0,0,0,0.06))",
    color: "#6b4d00",
    cursor: "pointer",
  },
  tagBtn: {
    padding: "8px 0",
    fontWeight: 1000,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(0,0,0,0.06))",
    cursor: "pointer",
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
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(0,0,0,0.05))",
    fontWeight: 900,
    cursor: "pointer",
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
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    padding: 14,
    backdropFilter: "blur(6px)",
  },
};
