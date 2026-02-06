import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function GamePickerCard({ games, gameId, setGameId, onOpenHelp, members = [] }) {
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

        {members?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
              Spieler ({members.length})
            </div>

            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {members.map((m) => {
                const name = ((m.display_name || "").trim() || (m.email || "").trim() || "—");
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(233,216,166,0.18)",
                      background: "rgba(10,10,12,0.35)",
                      color: stylesTokens.textMain,
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
