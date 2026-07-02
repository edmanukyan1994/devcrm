import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({
  onNeedRefresh() {
    if (confirm("Доступна новая версия. Обновить?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.info("DevCRM готов к работе офлайн");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
