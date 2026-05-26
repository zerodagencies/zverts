import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

// PWA / standalone scroll safety net.
// Radix dialogs, sheets, drawers and the mobile menu all temporarily set
// `body { overflow: hidden }` or `data-scroll-locked`. On Android Chrome
// in installed-PWA mode, if an unmount races with a route change the lock
// can persist and freeze touch scrolling. Force-clear on every page show
// and tab focus.
const releaseScrollLock = () => {
  const b = document.body;
  if (!b) return;
  if (b.style.overflow === "hidden") b.style.overflow = "";
  if (b.style.position === "fixed") {
    b.style.position = "";
    b.style.top = "";
    b.style.width = "";
  }
  b.removeAttribute("data-scroll-locked");
  document.documentElement.style.overflow = "";
};
window.addEventListener("pageshow", releaseScrollLock);
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") releaseScrollLock();
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
