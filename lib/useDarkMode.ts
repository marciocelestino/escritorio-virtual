"use client";

import { useEffect, useState } from "react";

// Modo escuro é o padrão agora (o visual novo do escritório foi
// desenhado pensando nele) — só some se a própria pessoa escolher o
// tema claro explicitamente (nunca pela preferência do sistema
// operacional, isso já quebrou a legibilidade uma vez, ver globals.css).
// Persiste em localStorage pra lembrar entre sessões.
export function useDarkMode() {

  const [dark, setDark] = useState(() => {

    if (typeof window === "undefined") {
      return true;
    }

    return (
      localStorage.getItem("tema") !== "claro"
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
