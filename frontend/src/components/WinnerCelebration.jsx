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

      // 2 große Bursts
      confetti({
        particleCount: 150,
        spread: 95,
        startVelocity: 38,
        origin: { x: 0.12, y: 0.62 },
        zIndex: 999999,
      });
      confetti({
        particleCount: 150,
        spread: 95,
        startVelocity: 38,
        origin: { x: 0.88, y: 0.62 },
        zIndex: 999999,
      });

      // “Rain” über die Zeit
      (function frame() {
        confetti({
          particleCount: 6,
          spread: 70,
          startVelocity: 32,
          origin: { x: Math.random(), y: Math.random() * 0.18 },
          scalar: 1.0,
          zIndex: 999999,
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
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.58)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: 12,
      }}
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          borderRadius: 22,
          padding: "16px 16px",
          border: `1px solid ${stylesTokens.panelBorder}`,
          background: stylesTokens.panelBg,
          boxShadow: "0 22px 90px rgba(0,0,0,0.60)",
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
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />

        {/* kleine “shine” Ecke oben rechts */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -120,
            width: 260,
            height: 220,
            background: `radial-gradient(circle at 30% 30%, ${stylesTokens.goldLine}, transparent 60%)`,
            opacity: 0.12,
            transform: "rotate(12deg)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 34, lineHeight: 1 }}>🏆</div>

          <div
            style={{
              marginTop: 8,
              fontSize: 18,
              fontWeight: 900,
              color: stylesTokens.textMain,
            }}
          >
            Spieler{" "}
            <span style={{ color: stylesTokens.textGold }}>
              {winnerName || "Unbekannt"}
            </span>{" "}
            hat die richtige Lösung!
          </div>

          <div style={{ marginTop: 8, color: stylesTokens.textDim, opacity: 0.95 }}>
            Fall gelöst. Respekt. ✨
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
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
