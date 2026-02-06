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

  // ✅ Warten bis ALLE Fonts geladen sind
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // ignore
  }

  // ✅ Erst JETZT sichtbar machen
  document.body.classList.remove("preload");
  document.body.classList.add("ready");

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);

  // ✅ Service Worker – KEIN Auto-Reload mehr
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.info("Neue Version verfügbar – Reload manuell");
      // optional: später Toast „Update verfügbar“
    },
  });
}

bootstrap();
