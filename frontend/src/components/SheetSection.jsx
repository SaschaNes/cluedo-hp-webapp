// src/components/SheetSection.jsx
import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function SheetSection({
  title,
  entries,
  pulseId,
  onCycleStatus,
  onToggleTag,
  displayTag,
}) {
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
    if (status === 2) return { color: stylesTokens.badgeOkText, background: stylesTokens.badgeOkBg };
    if (status === 1) return { color: stylesTokens.badgeNoText, background: stylesTokens.badgeNoBg };
    if (status === 3) return { color: stylesTokens.badgeMaybeText, background: stylesTokens.badgeMaybeBg };
    return { color: stylesTokens.badgeEmptyText, background: stylesTokens.badgeEmptyBg };
  };

  const getBorderLeft = (status) => {
    if (status === 2) return `4px solid ${stylesTokens.rowOkBorder}`;
    if (status === 1) return `4px solid ${stylesTokens.rowNoBorder}`;
    if (status === 3) return `4px solid ${stylesTokens.rowMaybeBorder}`;
    return `4px solid ${stylesTokens.rowEmptyBorder}`;
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>{title}</div>

      <div style={{ display: "grid" }}>
        {entries.map((e) => {
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
                borderLeft: getBorderLeft(effectiveStatus),
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
