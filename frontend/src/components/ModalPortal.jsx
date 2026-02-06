import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { styles } from "../styles/styles";

export default function ModalPortal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    // Scroll der Seite sperren
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      style={styles.modalOverlay}
      onMouseDown={(e) => {
        // Klick außerhalb schließt
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
