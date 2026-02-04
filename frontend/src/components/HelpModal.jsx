// src/components/HelpModal.jsx
import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function HelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Hilfe</div>
          <button onClick={onClose} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={styles.helpBody}>
          <div style={styles.helpSectionTitle}>1) Namen anklicken (Status)</div>
          <div style={styles.helpText}>
            Tippe auf einen Namen, um den Status zu wechseln. Reihenfolge:
          </div>

          <div style={styles.helpList}>
            <div style={styles.helpListRow}>
              <span
                style={{
                  ...styles.helpBadge,
                  background: "rgba(0,190,80,0.18)",
                  color: "#baf3c9",
                }}
              >
                ✓
              </span>
              <div>
                <b>Grün</b> = bestätigt / fix richtig
              </div>
            </div>

            <div style={styles.helpListRow}>
              <span
                style={{
                  ...styles.helpBadge,
                  background: "rgba(255,35,35,0.18)",
                  color: "#ffb3b3",
                }}
              >
                ✕
              </span>
              <div>
                <b>Rot</b> = ausgeschlossen / fix falsch
              </div>
            </div>

            <div style={styles.helpListRow}>
              <span
                style={{
                  ...styles.helpBadge,
                  background: "rgba(140,140,140,0.14)",
                  color: "rgba(233,216,166,0.85)",
                }}
              >
                ?
              </span>
              <div>
                <b>Grau</b> = unsicher / „vielleicht“
              </div>
            </div>

            <div style={styles.helpListRow}>
              <span
                style={{
                  ...styles.helpBadge,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(233,216,166,0.75)",
                }}
              >
                –
              </span>
              <div>
                <b>Leer</b> = unknown / noch nicht bewertet
              </div>
            </div>
          </div>

          <div style={styles.helpDivider} />

          <div style={styles.helpSectionTitle}>2) i / m / s Button (Notiz)</div>
          <div style={styles.helpText}>
            Rechts pro Zeile gibt es einen Button, der durch diese Werte rotiert:
          </div>

          <div style={styles.helpList}>
            <div style={styles.helpListRow}>
              <span style={styles.helpMiniTag}>i</span>
              <div>
                <b>i</b> = „Ich habe diese Geheimkarte“
              </div>
            </div>

            <div style={styles.helpListRow}>
              <span style={styles.helpMiniTag}>m</span>
              <div>
                <b>m</b> = „Geheimkarte aus dem mittleren Deck“
              </div>
            </div>

            <div style={styles.helpListRow}>
              <span style={styles.helpMiniTag}>s</span>
              <div>
                <b>s</b> = „Ein anderer Spieler hat diese Karte“ (Chip Auswahl)
              </div>
            </div>

            <div style={styles.helpListRow}>
              <span style={styles.helpMiniTag}>—</span>
              <div>
                <b>—</b> = keine Notiz
              </div>
            </div>
          </div>

          <div style={styles.helpDivider} />

          <div style={styles.helpText}>
            Tipp: Jeder Spieler sieht nur seine eigenen Notizen – andere Spieler können nicht in
            deinen Zettel schauen.
          </div>
        </div>
      </div>
    </div>
  );
}
