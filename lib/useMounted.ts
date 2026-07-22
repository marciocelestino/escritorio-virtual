"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

// Indica se o componente já passou da hidratação inicial no navegador —
// substitui o padrão `useState(false)` + `setMounted(true)` num efeito
// (que dispara um aviso de lint por chamar setState direto num efeito),
// sem mudar o comportamento: o valor ainda começa false no servidor e na
// primeira renderização do cliente, e vira true logo em seguida.
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
