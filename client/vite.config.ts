import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icon-192.svg", "icon-512.svg", "apple-touch-icon.svg"],
      manifest: {
        name: "DevCRM",
        short_name: "DevCRM",
        description: "CRM для веб-разработчиков и заказчиков",
        theme_color: "#0A0A0A",
        background_color: "#FAFAFA",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "ru",
        categories: ["business", "productivity"],
        icons: [
          { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
          { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
