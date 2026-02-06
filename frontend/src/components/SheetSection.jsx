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
    if (status === 1) return stylesTokens.rowNoBg;
    if (status === 2) return stylesTokens.rowOkBg;
    if (status === 3) return stylesTokens.rowMaybeBg;
    if (status === 0) return stylesTokens.rowEmptyBg;
    return stylesTokens.rowDefaultBg;
  };

  const getNameColor = (status) => {
    if (status === 1) return stylesTokens.rowNoText;
    if (status === 2) return stylesTokens.rowOkText;
    if (status === 3) return stylesTokens.rowMaybeText;
    return stylesTokens.textMain;
  };

  const getStatusSymbol = (status) => {
    if (status === 2) return "✓";
    if (status === 1) return "✕";
    if (status === 3) return "?";
    return "–";
  };

  const getStatusBadge = (status) => {
    if (status === 2) return { color: stylesTokens.rowOkText, background: stylesTokens.rowOkBg };
    if (status === 1) return { color: stylesTokens.rowNoText, background: stylesTokens.rowNoBg };
    if (status === 3) return { color: stylesTokens.rowMaybeText, background: stylesTokens.rowMaybeBg };
    return { color: stylesTokens.rowEmptyText, background: stylesTokens.rowEmptyBg };
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
                    ? `4px solid ${stylesTokens.rowOkBorder}`
                    : effectiveStatus === 1
                    ? `4px solid ${stylesTokens.rowNoBorder}`
                    : effectiveStatus === 3
                    ? `4px solid ${stylesTokens.rowMaybeBorder}`
                    : `4px solid ${stylesTokens.rowEmptyBorder}`,
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
