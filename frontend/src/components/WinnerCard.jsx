import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function WinnerCard({ value, setValue, onSave }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={styles.card}>
        <div style={styles.sectionHeader}>Sieger</div>

        <div style={styles.cardBody}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Name des Siegers"
            style={{ ...styles.input, flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
            }}
          />

          <button onClick={onSave} style={styles.primaryBtn} title="Speichern">
            Speichern
          </button>
        </div>

        <div style={{ padding: "0 12px 12px", fontSize: 12, color: stylesTokens.textDim }}>
          Wird pro Spiel lokal gespeichert.
        </div>
      </div>
    </div>
  );
}
