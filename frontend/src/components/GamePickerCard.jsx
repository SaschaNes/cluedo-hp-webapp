// src/components/GamePickerCard.jsx
import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function GamePickerCard({ games, gameId, setGameId, joinCode, onOpenHelp }) {
  return (
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

          <button onClick={onOpenHelp} style={styles.helpBtn} title="Hilfe">
            Hilfe
          </button>
        </div>

        {!!joinCode && (
          <div
            style={{
              padding: "0 12px 12px",
              fontSize: 12,
              opacity: 0.85,
              color: stylesTokens.textDim,
            }}
          >
            Spiel-Code: <b style={{ color: stylesTokens.textGold }}>{joinCode}</b>
          </div>
        )}
      </div>
    </div>
  );
}
