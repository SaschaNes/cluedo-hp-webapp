import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";
import { registerSW } from "virtual:pwa-register";

async function bootstrap() {
  // Theme sofort setzen
  try {
    const key = localStorage.getItem("hpTheme:guest") || DEFAULT_THEME_KEY;
    applyTheme(key);
  } catch {
    applyTheme(DEFAULT_THEME_KEY);
  }

  // Fonts abwarten (verhindert Layout-Sprung)
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {}

  // App rendern
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);

  // Splash mind. 3 Sekunden anzeigen (3000ms)
  const MIN_SPLASH_MS = 3000;
  const tStart = performance.now();

  const hideSplash = () => {
    const splash = document.getElementById("app-splash");
    if (!splash) return;
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 320);
  };

  const elapsed = performance.now() - tStart;
  const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
  setTimeout(hideSplash, remaining);

  // Service Worker ohne Auto-Reload-Flash
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.info("Neue Version verfügbar");
      // optional: später Toast "Update verfügbar"
    },
  });
}

bootstrap();
