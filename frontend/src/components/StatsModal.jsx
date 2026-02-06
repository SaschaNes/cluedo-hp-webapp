import React from "react";
import { createPortal } from "react-dom";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

function Tile({ label, value, sub }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid rgba(233,216,166,0.16)`,
        background: "rgba(10,10,12,0.55)",
        padding: 12,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.8,
          color: stylesTokens.textDim,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontWeight: 1000,
          fontSize: 26,
          lineHeight: "30px",
          color: stylesTokens.textGold,
        }}
      >
        {value}
      </div>

      {sub ? (
        <div style={{ marginTop: 2, fontSize: 12, opacity: 0.85, color: stylesTokens.textDim }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function StatsModal({ open, onClose, me, stats, loading, error }) {
  if (!open) return null;

  const displayName = me ? ((me.display_name || "").trim() || me.email) : "";

  return createPortal(
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Statistik</div>
            <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
              {displayName}
            </div>
          </div>

          <button onClick={onClose} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ padding: 10, color: stylesTokens.textDim, opacity: 0.9 }}>
              Lade Statistik…
            </div>
          ) : error ? (
            <div style={{ padding: 10, color: "#ffb3b3" }}>{error}</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <Tile label="Gespielte Spiele" value={stats?.played ?? 0} />
              <Tile label="Siege" value={stats?.wins ?? 0} />
              <Tile label="Verluste" value={stats?.losses ?? 0} />
              <Tile label="Siegerate" value={`${stats?.winrate ?? 0}%`} sub="nur beendete Spiele" />
            </div>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
          Hinweis: „Gespielt“ zählt nur Spiele mit gesetztem Sieger.
        </div>
      </div>
    </div>,
    document.body
  );
}
