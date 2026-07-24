"use client";

import { useEffect } from "react";

// Enregistrement du service worker (PWA : installation, cache minimal,
// page hors connexion).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
