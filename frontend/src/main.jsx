import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")).render(<App />);
registerSW({ immediate: true });
const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true); // sofort neue Version aktivieren
      window.location.reload();
    },
  });
