import React from "react";
import { stylesTokens } from "../styles/theme";

/**
 * Props:
 * - winner: { display_name?: string, email?: string } | null
 * - winnerEmail: string | null (legacy fallback)
 */
export default function WinnerBadge({ winner, winnerEmail }) {
  const name =
    (winner?.display_name || "").trim() ||
    (winner?.email || "").trim() ||
    (winnerEmail || "").trim();

  if (!name) return null;

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
          <span style={{ color: stylesTokens.textGold }}>{" "}{name}</span>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
        festgelegt
      </div>
    </div>
  );
}
