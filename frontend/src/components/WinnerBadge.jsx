import React from "react";
import { stylesTokens } from "../styles/theme";

export default function WinnerBadge({ winnerEmail }) {
  if (!winnerEmail) return null;

  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 14px",
        borderRadius: 16,
        border: `1px solid ${stylesTokens.panelBorder}`,
        background: stylesTokens.panelBg,
        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 16 }}>🏆</span>
      <span style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Sieger:</span>
      <span style={{ color: stylesTokens.textMain }}>{winnerEmail}</span>
    </div>
  );
}
