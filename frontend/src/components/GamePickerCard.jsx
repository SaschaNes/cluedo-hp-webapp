// src/components/GamePickerCard.jsx
import React from "react";
import { styles } from "../styles/styles";

export default function GamePickerCard({
  games,
  gameId,
  setGameId,
  onOpenHelp,
}) {
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
      </div>
    </div>
  );
}
