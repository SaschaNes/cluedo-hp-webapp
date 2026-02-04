import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";
import { CHIP_LIST } from "../constants";

export default function ChipModal({ chipOpen, closeChipModalToDash, chooseChip }) {
  if (!chipOpen) return null;

  return (
    <div style={styles.modalOverlay} onMouseDown={closeChipModalToDash}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>Wer hat die Karte?</div>
          <button onClick={closeChipModalToDash} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, color: stylesTokens.textMain }}>Chip auswählen:</div>

        <div style={styles.chipGrid}>
          {CHIP_LIST.map((c) => (
            <button key={c} onClick={() => chooseChip(c)} style={styles.chipBtn}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: stylesTokens.textDim }}>
          Tipp: Wenn du wieder auf den Notiz-Button klickst, geht’s von <b>s</b> zurück auf —.
        </div>
      </div>
    </div>
  );
}
