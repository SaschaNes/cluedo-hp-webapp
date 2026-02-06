import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";
import { createPortal } from "react-dom";


useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
export default function AdminPanel() {
  const [users, setUsers] = useState([]);

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
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
    setDisplayName("");
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const createUser = async () => {
    setMsg("");
    try {
      await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ display_name: displayName, email, password, role }),
      });
      setMsg("✅ User erstellt.");
      await loadUsers();
      resetForm();
      setOpen(false);
    } catch (e) {
      setMsg("❌ Fehler: " + (e?.message || "unknown"));
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`User wirklich löschen (deaktivieren)?\n\n${u.display_name || u.email}`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      alert("Fehler: " + (e?.message || "unknown"));
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
          <div
            key={u.id}
            style={{
              ...styles.userRow,
              gridTemplateColumns: "1fr 1fr 80px 90px 92px",
              alignItems: "center",
            }}
          >
            <div style={{ color: stylesTokens.textMain, fontWeight: 900 }}>
              {u.display_name || "—"}
            </div>
            <div style={{ color: stylesTokens.textDim, fontSize: 13 }}>{u.email}</div>
            <div style={{ textAlign: "center", fontWeight: 900, color: stylesTokens.textGold }}>
              {u.role}
            </div>
            <div style={{ textAlign: "center", opacity: 0.85, color: stylesTokens.textMain }}>
              {u.disabled ? "disabled" : "active"}
            </div>

            <button
              onClick={() => deleteUser(u)}
              style={{
                ...styles.secondaryBtn,
                padding: "8px 10px",
                borderRadius: 12,
                color: "#ffb3b3",
                opacity: u.role === "admin" ? 0.4 : 1,
                pointerEvents: u.role === "admin" ? "none" : "auto",
              }}
              title={u.role === "admin" ? "Admin kann nicht gelöscht werden" : "User löschen (deaktivieren)"}
            >
              Löschen
            </button>
          </div>
        ))}
      </div>

      {open &&
        createPortal(
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

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Name (z.B. Sascha)"
                  style={styles.input}
                  autoFocus
                />

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  style={styles.input}
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
                  Tipp: Name wird in TopBar & Siegeranzeige genutzt.
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}
