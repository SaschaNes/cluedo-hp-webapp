import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "icons/icon-512.png",
        "marauders-map.jpg" // oder dein Hintergrund
      ],
      manifest: {
        name: "Zauber-Detektiv Notizbogen",
        short_name: "Notizbogen",
        description: "Cluedo-Magie Sheet",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#1c140d",
        theme_color: "#caa45a",
        icons: [
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        // Caching-Default: die App-Shell wird offline verfügbar
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}"],
      }
    })
  ]
});
