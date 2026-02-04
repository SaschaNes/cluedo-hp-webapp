// src/components/SheetSection.jsx
import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

/**
 * props:
 * - title: string
 * - entries: array
 * - pulseId: number | null
 * - onCycleStatus(entry): fn
 * - onToggleTag(entry): fn
 * - displayTag(entry): string
 */
export default function SheetSection({
  title,
  entries,
  pulseId,
  onCycleStatus,
  onToggleTag,
  displayTag,
}) {
  // --- helpers (lokal, weil sie rein UI sind) ---
  const getRowBg = (status) => {
    if (status === 1) return "rgba(255, 35, 35, 0.16)";
    if (status === 2) return "rgba(0, 190, 80, 0.16)";
    if (status === 3) return "rgba(140, 140, 140, 0.12)";
    return "rgba(255,255,255,0.06)";
  };

  const getNameColor = (status) => {
    if (status === 1) return "#ffb3b3";
    if (status === 2) return "#baf3c9";
    if (status === 3) return "rgba(233,216,166,0.78)";
    return stylesTokens.textMain;
  };

  const getStatusSymbol = (status) => {
    if (status === 2) return "✓";
    if (status === 1) return "✕";
    if (status === 3) return "?";
    return "–";
  };

  const getStatusBadge = (status) => {
    if (status === 2) return { color: "#baf3c9", background: "rgba(0,190,80,0.18)" };
    if (status === 1) return { color: "#ffb3b3", background: "rgba(255,35,35,0.18)" };
    if (status === 3)
      return { color: "rgba(233,216,166,0.85)", background: "rgba(140,140,140,0.14)" };
    return { color: "rgba(233,216,166,0.75)", background: "rgba(255,255,255,0.08)" };
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>{title}</div>

      <div style={{ display: "grid" }}>
        {entries.map((e) => {
          // UI "rot" wenn note_tag i/m/s (Backend s wird als s.XX angezeigt)
          const isIorMorS = e.note_tag === "i" || e.note_tag === "m" || e.note_tag === "s";
          const effectiveStatus = e.status === 0 && isIorMorS ? 1 : e.status;

          const badge = getStatusBadge(effectiveStatus);

          return (
            <div
              key={e.entry_id}
              className="hp-row"
              style={{
                ...styles.row,
                background: getRowBg(effectiveStatus),
                animation: pulseId === e.entry_id ? "rowPulse 220ms ease-out" : "none",
                borderLeft:
                  effectiveStatus === 2
                    ? "4px solid rgba(0,190,80,0.55)"
                    : effectiveStatus === 1
                    ? "4px solid rgba(255,35,35,0.55)"
                    : effectiveStatus === 3
                    ? "4px solid rgba(233,216,166,0.22)"
                    : "4px solid rgba(0,0,0,0)",
              }}
            >
              <div
                onClick={() => onCycleStatus(e)}
                style={{
                  ...styles.name,
                  textDecoration: effectiveStatus === 1 ? "line-through" : "none",
                  color: getNameColor(effectiveStatus),
                  opacity: effectiveStatus === 1 ? 0.8 : 1,
                }}
                title="Klick: Grün → Rot → Grau → Leer"
              >
                {e.label}
              </div>

              <div style={styles.statusCell}>
                <span
                  style={{
                    ...styles.statusBadge,
                    color: badge.color,
                    background: badge.background,
                  }}
                >
                  {getStatusSymbol(effectiveStatus)}
                </span>
              </div>

              <button
                onClick={() => onToggleTag(e)}
                style={styles.tagBtn}
                title="— → i → m → s.(Chip) → —"
              >
                {displayTag(e)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
