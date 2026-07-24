"use client";

import { useEffect } from "react";

// Registra o service worker mínimo (public/sw.js) — necessário pro
// navegador oferecer "Instalar app" de forma confiável, mesmo esse
// service worker não fazendo cache/offline de verdade.
export default function ServiceWorkerRegister() {

  useEffect(() => {

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {});
    }

  }, []);

  return null;

}
