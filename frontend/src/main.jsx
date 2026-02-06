import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";
import { registerSW } from "virtual:pwa-register";

async function bootstrap() {
  // ✅ Theme sofort setzen
  try {
    const key = localStorage.getItem("hpTheme:guest") || DEFAULT_THEME_KEY;
    applyTheme(key);
  } catch {
    applyTheme(DEFAULT_THEME_KEY);
  }

  // ✅ Fonts abwarten (kein Layout-Jump)
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {}

  // React rendern
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);

  // ✅ Splash sauber ausblenden (KEIN Schwarz)
  const splash = document.getElementById("app-splash");
  if (splash) {
    requestAnimationFrame(() => splash.classList.add("hide"));
    setTimeout(() => splash.remove(), 220);
  }

  // ✅ Service Worker ohne Reload-Flash
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.info("Neue Version verfügbar");
      // später Toast möglich
    },
  });
}

bootstrap();
