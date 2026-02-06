// src/components/WinnerCard.jsx
import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

/**
 * props:
 * - players: [{id,email}]
 * - winnerUserId: string|null
 * - setWinnerUserId: fn
 * - onSave: fn (async ok)
 */
export default function WinnerCard({ players, winnerUserId, setWinnerUserId, onSave }) {
  const hasPlayers = Array.isArray(players) && players.length > 0;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={styles.card}>
        <div style={styles.sectionHeader}>Sieger</div>

        <div style={{ padding: 12, display: "grid", gap: 10 }}>
          {!hasPlayers ? (
            <div style={{ color: stylesTokens.textDim, opacity: 0.9 }}>
              Keine Spieler gefunden (Admin wird nicht angezeigt).
            </div>
          ) : (
            <select
              value={winnerUserId || ""}
              onChange={(e) => setWinnerUserId(e.target.value || null)}
              style={styles.input}
            >
              <option value="">— kein Sieger gesetzt —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setWinnerUserId(null)} style={styles.secondaryBtn}>
              Leeren
            </button>
            <button onClick={onSave} style={styles.primaryBtn} disabled={!hasPlayers}>
              Speichern
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
            Der Sieger wird im Spiel gespeichert und ist für alle Spieler sichtbar.
          </div>
        </div>
      </div>
    </div>
  );
}
