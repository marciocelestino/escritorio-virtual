"use client";

import { useEffect, useState } from "react";

// Modo escuro só ativa se a pessoa escolher — nunca pela preferência do
// sistema operacional (isso já quebrou a legibilidade uma vez, ver
// globals.css). Persiste em localStorage pra lembrar entre sessões.
export function useDarkMode() {

  const [dark, setDark] = useState(() => {

    if (typeof window === "undefined") {
      return false;
    }

    return (
      localStorage.getItem("tema") === "escuro"
    );

  });

  useEffect(() => {

    document.documentElement.classList.toggle(
      "dark",
      dark
    );

    localStorage.setItem(
      "tema",
      dark ? "escuro" : "claro"
    );

  }, [dark]);

  return [dark, setDark] as const;
}
