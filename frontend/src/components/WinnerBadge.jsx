// src/components/WinnerBadge.jsx
import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function WinnerBadge({ winner }) {
  const w = (winner || "").trim();
  if (!w) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          ...styles.card,
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>🏆 Sieger</div>
          <div style={{ marginTop: 2, color: stylesTokens.textMain, opacity: 0.95 }}>{w}</div>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid ${stylesTokens.panelBorder}`,
            background: stylesTokens.panelBg,
            color: stylesTokens.textGold,
            fontWeight: 1000,
            whiteSpace: "nowrap",
          }}
        >
          Gewonnen
        </div>
      </div>
    </div>
  );
}
