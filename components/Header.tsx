"use client";

import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default function Header() {
  const router = useRouter();

  const user = getSessionUser();

  const logout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("status");

    router.push("/");
  };

  return (
    <header className="flex items-center justify-between border-b bg-slate-900 px-6 py-4 text-white">
      <div className="flex items-center gap-4">
        <img
          src="/logo.png"
          alt="Internit"
          className="h-10"
        />

        <div>
          <h1 className="text-xl font-bold">
            INTERNIT OFFICE
          </h1>

          <p className="text-xs text-slate-300">
            Escritório Virtual
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm">
          {user?.nome || "Usuário"}
        </span>

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
    </header>
  );
}