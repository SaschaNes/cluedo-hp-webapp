import { useEffect } from "react";
import { stylesTokens } from "../theme";

export function useHpGlobalStyles() {
  // Google Fonts
  useEffect(() => {
    if (document.getElementById("hp-fonts")) return;

    const pre1 = document.createElement("link");
    pre1.id = "hp-fonts-pre1";
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";

    const pre2 = document.createElement("link");
    pre2.id = "hp-fonts-pre2";
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";

    const link = document.createElement("link");
    link.id = "hp-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=IM+Fell+English:ital,wght@0,400;0,700;1,400&display=swap";

    document.head.appendChild(pre1);
    document.head.appendChild(pre2);
    document.head.appendChild(link);
  }, []);

  // Keyframes
  useEffect(() => {
    if (document.getElementById("hp-anim-style")) return;
    const style = document.createElement("style");
    style.id = "hp-anim-style";
    style.innerHTML = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes popIn { from { opacity: 0; transform: translateY(8px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes rowPulse { 0%{ transform: scale(1); } 50%{ transform: scale(1.01); } 100%{ transform: scale(1); } }
      @keyframes candleGlow {
        0%   { opacity: .55; transform: translateY(0px) scale(1); filter: blur(16px); }
        35%  { opacity: .85; transform: translateY(-2px) scale(1.02); filter: blur(18px); }
        70%  { opacity: .62; transform: translateY(1px) scale(1.01); filter: blur(17px); }
        100% { opacity: .55; transform: translateY(0px) scale(1); filter: blur(16px); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // html/body reset
  useEffect(() => {
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.body.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.padding = "0";
  }, []);

  // Global CSS
  useEffect(() => {
    if (document.getElementById("hp-global-style")) return;
    const style = document.createElement("style");
    style.id = "hp-global-style";
    style.innerHTML = `
      html, body {
        overscroll-behavior-y: none;
        -webkit-text-size-adjust: 100%;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: ${stylesTokens.pageBg};
        color: ${stylesTokens.textMain};
      }
      body {
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }
      #root { background: transparent; }
      * { -webkit-tap-highlight-color: transparent; }
    `;
    document.head.appendChild(style);
  }, []);
}