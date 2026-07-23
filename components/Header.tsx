"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import MeusDados from "@/components/MeusDados";
import { useDarkMode } from "@/lib/useDarkMode";

export default function Header() {
  const router = useRouter();

  const user = getSessionUser();

  const [showMeusDados, setShowMeusDados] =
    useState(false);

  const [darkMode, setDarkMode] =
    useDarkMode();

  const logout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("status");

    router.push("/");
  };

  const status =
    typeof window !== "undefined"
      ? localStorage.getItem("status")
      : null;

  const emoji =
    status === "Ausente"
      ? "🟡"
      : status === "Reuniao"
      ? "🔴"
      : "🟢";

  return (
    <header
      className="
        flex
        items-center
        justify-between
        border-b
        bg-slate-950
        px-6
        py-4
        text-white
      "
    >
      <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="Internit"
          width={200}
          height={70}
          className="h-10 w-auto"
        />
      </div>

      <div className="flex items-center gap-6">
        {user?.isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-slate-300 hover:text-white"
          >
            Administração
          </Link>
        )}

        <button
          onClick={() =>
            setShowMeusDados(true)
          }
          className="text-right hover:opacity-80"
        >
          <div>
            👤 {user?.nome}
          </div>

          <div className="text-sm text-slate-300">
            {emoji} {status || "Disponível"}
          </div>
        </button>

        <button
          onClick={() =>
            setDarkMode((current) => !current)
          }
          title={
            darkMode
              ? "Mudar para tema claro"
              : "Mudar para tema escuro"
          }
          className="
            rounded-lg
            border
            border-slate-700
            px-3
            py-2
            text-sm
            text-slate-300
            hover:bg-slate-900
          "
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <button
          onClick={logout}
          className="
            rounded-lg
            bg-red-600
            px-4
            py-2
            text-sm
            hover:bg-red-700
          "
        >
          Sair
        </button>
      </div>

      {showMeusDados && (
        <MeusDados
          onClose={() =>
            setShowMeusDados(false)
          }
        />
      )}
    </header>
  );
}
