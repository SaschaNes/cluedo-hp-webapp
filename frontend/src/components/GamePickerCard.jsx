import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function GamePickerCard({ games, gameId, setGameId, onOpenHelp }) {
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
                {g.name} {g.code ? `• ${g.code}` : ""}
              </option>
            ))}
          </select>

          <button onClick={onOpenHelp} style={styles.helpBtn} title="Hilfe">
            Hilfe
          </button>
        </div>

        {/* kleine Code Zeile unter dem Picker (optional nice) */}
        {(() => {
          const cur = games.find((x) => x.id === gameId);
          if (!cur?.code) return null;
          return (
            <div style={{ padding: "0 12px 12px", fontSize: 12, color: stylesTokens.textDim, opacity: 0.9 }}>
              Code: <b style={{ color: stylesTokens.textGold }}>{cur.code}</b>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
