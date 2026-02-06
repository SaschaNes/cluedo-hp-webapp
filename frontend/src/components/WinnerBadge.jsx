import React from "react";
import { stylesTokens } from "../styles/theme";

export default function WinnerBadge({ winnerEmail }) {
  if (!winnerEmail) return null;

  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 12px",
        borderRadius: 16,
        border: `1px solid ${stylesTokens.panelBorder}`,
        background: stylesTokens.panelBg,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 18 }}>🏆</div>
        <div style={{ color: stylesTokens.textMain, fontWeight: 900 }}>
          Sieger:
          <span style={{ color: stylesTokens.textGold }}>{" "}{winnerEmail}</span>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
        festgelegt
      </div>
    </div>
  );
}
