// src/components/JoinGameModal.jsx
import React, { useEffect, useState } from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function JoinGameModal({ open, onClose, onJoin }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setMsg("");
    setBusy(false);
  }, [open]);

  if (!open) return null;

  const doJoin = async () => {
    const c = (code || "").trim();
    if (!c) return setMsg("❌ Bitte Code eingeben.");
    setBusy(true);
    setMsg("");
    try {
      await onJoin(c);
    } catch (e) {
      setMsg("❌ Fehler: " + (e?.message || "unknown"));
      setBusy(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Spiel beitreten</div>
          <button onClick={onClose} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="z.B. 123456"
            style={styles.input}
            inputMode="numeric"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") doJoin();
            }}
          />

          {msg && <div style={{ opacity: 0.92, color: stylesTokens.textMain }}>{msg}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={styles.secondaryBtn} disabled={busy}>
              Abbrechen
            </button>
            <button onClick={doJoin} style={styles.primaryBtn} disabled={busy}>
              {busy ? "Beitreten..." : "Beitreten"}
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
            Tipp: Der Spiel-Code steht beim Host unter dem Spiel-Dropdown.
          </div>
        </div>
      </div>
    </div>
  );
}
