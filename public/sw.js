// Service worker mínimo — só existe pra habilitar a instalação como
// PWA (a maioria dos navegadores exige um service worker com um
// handler de "fetch" registrado pra mostrar o ícone de instalar).
// Não faz cache nem funciona offline de propósito — o app depende de
// WebSocket em tempo real, "offline de verdade" não faria sentido
// ainda sem repensar a arquitetura toda.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
