import React, { useEffect, useState } from "react";

const API = "http://localhost:8080";

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

export default function App() {
  const [me, setMe] = useState(null);
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("");
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [tab, setTab] = useState("suspect");

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
    await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await load();
  };

  const newGame = async () => {
    const g = await api("/games", { method: "POST", body: JSON.stringify({ name: "Spiel " + new Date().toLocaleString() }) });
    const gs = await api("/games");
    setGames(gs);
    setGameId(g.id);
  };

  const toggleCross = async (entry) => {
    // Tap auf Name: unknown <-> crossed
    const next = entry.status === 1 ? 0 : 1;
    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    const sh = await api(`/games/${gameId}/sheet`);
    setSheet(sh);
  };

  const toggleTag = async (entry) => {
    const next = cycleTag(entry.note_tag);
    await api(`/games/${gameId}/sheet/${entry.entry_id}`, {
      method: "PATCH",
      body: JSON.stringify({ note_tag: next }),
    });
    const sh = await api(`/games/${gameId}/sheet`);
    setSheet(sh);
  };

  if (!me) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h2>Login</h2>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="password" style={{ width: "100%", padding: 10, marginBottom: 8 }} />
        <button onClick={doLogin} style={{ width: "100%", padding: 12 }}>Anmelden</button>
        <p style={{ opacity: 0.7, marginTop: 10 }}>Default Admin: admin@local (Passwort aus .env)</p>
      </div>
    );
  }

  const entries = sheet ? sheet[tab] : [];

  return (
    <div style={{ fontFamily: "system-ui", padding: 12, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{me.email}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{me.role}</div>
        </div>
        <button onClick={newGame} style={{ padding: "10px 12px" }}>+ Neues Spiel</button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <select value={gameId || ""} onChange={(e) => setGameId(e.target.value)} style={{ flex: 1, padding: 10 }}>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {["suspect","item","location"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 10, fontWeight: tab===t ? 700 : 500 }}>
            {t === "suspect" ? "Verdächtige" : t === "item" ? "Gegenstand" : "Ort"}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        {entries.map((e) => (
          <div key={e.entry_id} style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 40px 52px", gap: 6, padding: 10, borderBottom: "1px solid #eee", alignItems: "center" }}>
            {/* Name: Tap toggelt crossed */}
            <div onClick={() => toggleCross(e)} style={{ cursor: "pointer", textDecoration: e.status === 1 ? "line-through" : "none", userSelect: "none" }}>
              {e.label}
            </div>

            {/* Spalte 1: X */}
            <div style={{ textAlign: "center", fontWeight: 800 }}>{e.status === 1 ? "X" : ""}</div>

            {/* Spalte 2: gelbes ✓ */}
            <div style={{ textAlign: "center", fontWeight: 800 }}>{e.status === 1 ? "✓" : ""}</div>

            {/* Spalte 3: grünes ✓ (für später, wenn du confirmed nutzt) */}
            <div style={{ textAlign: "center", fontWeight: 800 }}>{e.status === 2 ? "✓" : ""}</div>

            {/* Spalte 4: i/m/s */}
            <button onClick={() => toggleTag(e)} style={{ padding: "8px 0", fontWeight: 800 }}>
              {e.note_tag || "—"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
