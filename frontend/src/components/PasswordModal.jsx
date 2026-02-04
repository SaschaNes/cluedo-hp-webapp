import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function PasswordModal({
  pwOpen,
  closePwModal,
  pw1,
  setPw1,
  pw2,
  setPw2,
  pwMsg,
  pwSaving,
  savePassword,
}) {
  if (!pwOpen) return null;

  return (
    <div style={styles.modalOverlay} onMouseDown={closePwModal}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Passwort setzen</div>
          <button onClick={closePwModal} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="Neues Passwort"
            type="password"
            style={styles.input}
            autoFocus
          />
          <input
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Neues Passwort wiederholen"
            type="password"
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") savePassword();
            }}
          />

          {pwMsg && <div style={{ opacity: 0.92, color: stylesTokens.textMain }}>{pwMsg}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={closePwModal} style={styles.secondaryBtn} disabled={pwSaving}>
              Abbrechen
            </button>
            <button onClick={savePassword} style={styles.primaryBtn} disabled={pwSaving}>
              {pwSaving ? "Speichern..." : "Speichern"}
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
            Hinweis: Mindestens 8 Zeichen empfohlen.
          </div>
        </div>
      </div>
    </div>
  );
}
