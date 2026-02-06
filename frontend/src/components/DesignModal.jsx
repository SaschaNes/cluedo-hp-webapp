import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";
import { THEMES } from "../styles/themes";

export default function DesignModal({ open, onClose, themeKey, onSelect }) {
  if (!open) return null;

  const themeEntries = Object.entries(THEMES);

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Design ändern</div>
          <button onClick={onClose} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, color: stylesTokens.textMain, opacity: 0.92 }}>
          Wähle dein Theme:
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {themeEntries.map(([key, t]) => {
            const active = key === themeKey;

            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                style={{
                  ...styles.secondaryBtn,
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: active
                    ? `1px solid rgba(233,216,166,0.40)`
                    : `1px solid rgba(233,216,166,0.18)`,
                }}
              >
                <span style={{ fontWeight: 1000 }}>{t.label}</span>
                <span style={{ opacity: 0.75 }}>{active ? "✓ aktiv" : ""}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
          Hinweis: Das Design wird pro User gespeichert (Email).
        </div>
      </div>
    </div>
  );
}
