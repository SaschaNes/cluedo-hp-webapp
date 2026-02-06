import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function WinnerCard({
  isHost,
  members,
  winnerUserId,
  setWinnerUserId,
  onSave,
}) {
  if (!isHost) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={styles.card}>
        <div style={styles.sectionHeader}>Sieger</div>

        <div style={styles.cardBody}>
          <select
            value={winnerUserId || ""}
            onChange={(e) => setWinnerUserId(e.target.value || "")}
            style={{ ...styles.input, flex: 1 }}
          >
            <option value="">— kein Sieger —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </select>

          <button onClick={onSave} style={styles.primaryBtn}>
            Speichern
          </button>
        </div>

        <div style={{ padding: "0 12px 12px", fontSize: 12, color: stylesTokens.textDim, opacity: 0.9 }}>
          Nur der Host (Spiel-Ersteller) kann den Sieger setzen.
        </div>
      </div>
    </div>
  );
}
