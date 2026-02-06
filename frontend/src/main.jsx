import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyTheme, DEFAULT_THEME_KEY } from "./styles/themes";
import { registerSW } from "virtual:pwa-register";

try {
  const key = localStorage.getItem("hpTheme:guest") || DEFAULT_THEME_KEY;
  applyTheme(key);
} catch {
  applyTheme(DEFAULT_THEME_KEY);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
registerSW({ immediate: true });
const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true); // sofort neue Version aktivieren
      window.location.reload();
    },
  });
