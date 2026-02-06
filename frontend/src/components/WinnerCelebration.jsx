import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { stylesTokens } from "../styles/theme";

export default function WinnerCelebration({ open, winnerName, onClose }) {
  useEffect(() => {
    if (!open) return;

    // Scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      const end = Date.now() + 4500;

      // WICHTIG: über dem Overlay rendern
      const TOP_Z = 2147483647;

      // hellere Farben damit’s auch auf dark overlay knallt
      const bright = ["#ffffff", "#ffd166", "#06d6a0", "#4cc9f0", "#f72585"];

      // 2 große Bursts
      confetti({
        particleCount: 170,
        spread: 95,
        startVelocity: 42,
        origin: { x: 0.12, y: 0.62 },
        zIndex: TOP_Z,
        colors: bright,
      });
      confetti({
        particleCount: 170,
        spread: 95,
        startVelocity: 42,
        origin: { x: 0.88, y: 0.62 },
        zIndex: TOP_Z,
        colors: bright,
      });

      // “Rain” über die Zeit
      (function frame() {
        confetti({
          particleCount: 8,
          spread: 75,
          startVelocity: 34,
          origin: { x: Math.random(), y: Math.random() * 0.18 },
          scalar: 1.05,
          zIndex: TOP_Z,
          colors: bright,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }

    const t = setTimeout(() => onClose?.(), 5500);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // weniger dunkel -> Confetti wirkt heller
        background: "rgba(0,0,0,0.42)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: 14,
      }}
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          // kleiner + mobile friendly
          width: "min(420px, 90vw)",
          borderRadius: 18,
          padding: "14px 14px",
          border: `1px solid ${stylesTokens.panelBorder}`,
          background: stylesTokens.panelBg,
          boxShadow: "0 18px 70px rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dezente “Gold Line” */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, transparent, ${stylesTokens.goldLine}, transparent)`,
            opacity: 0.32,
            pointerEvents: "none",
          }}
        />

        {/* shine */}
        <div
          style={{
            position: "absolute",
            top: -70,
            right: -120,
            width: 240,
            height: 200,
            background: `radial-gradient(circle at 30% 30%, ${stylesTokens.goldLine}, transparent 60%)`,
            opacity: 0.12,
            transform: "rotate(12deg)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "grid", gap: 8 }}>
          <div style={{ fontSize: 30, lineHeight: 1 }}>🏆</div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: stylesTokens.textMain,
              lineHeight: 1.25,
            }}
          >
            Spieler{" "}
            <span style={{ color: stylesTokens.textGold }}>
              {winnerName || "Unbekannt"}
            </span>{" "}
            hat die richtige Lösung!
          </div>

          <div style={{ color: stylesTokens.textDim, opacity: 0.95, fontSize: 13 }}>
            Fall gelöst. Respekt. ✨
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 11px",
                borderRadius: 12,
                border: `1px solid ${stylesTokens.panelBorder}`,
                background: "rgba(255,255,255,0.06)",
                color: stylesTokens.textMain,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
