import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";
import { registerSW } from "virtual:pwa-register";

// ✅ Theme VOR React setzen (kein Theme-Flash)
try {
  const key = localStorage.getItem("hpTheme:guest") || DEFAULT_THEME_KEY;
  applyTheme(key);
} catch {
  applyTheme(DEFAULT_THEME_KEY);
}

// ✅ Preload Unlock (nach Theme!)
document.body.classList.remove("preload");
document.body.classList.add("ready");

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// ✅ Service Worker NUR EINMAL registrieren
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
    window.location.reload();
  },
});
