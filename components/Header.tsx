"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import MeusDados from "@/components/MeusDados";
import { useDarkMode } from "@/lib/useDarkMode";

export type Mention = {
  id: string;
  room: string;
  fromNome: string;
  message: string;
  at: number;
};

type Props = {
  mentions?: Mention[];
  onMentionClick?: (room: string) => void;
  onClearMentions?: () => void;
};

export default function Header({
  mentions = [],
  onMentionClick,
  onClearMentions,
}: Props) {
  const router = useRouter();

  const user = getSessionUser();

  const [showMeusDados, setShowMeusDados] =
    useState(false);

  const [showMentions, setShowMentions] =
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
      : status === "Almoco"
      ? "🍽️"
      : status === "Ocioso"
      ? "💤"
      : "🟢";

  const statusLabel =
    status === "Reuniao"
      ? "Reunião"
      : status === "Almoco"
      ? "Almoço"
      : status || "Disponível";

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
          width={240}
          height={84}
          className="h-14 w-auto"
        />
      </div>

      <div className="flex items-center gap-6">
        {user?.isAdmin && (
          <Link
            href="/admin"
            title="Administração"
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
            ⚙️
          </Link>
        )}

        <div className="relative">

          <button
            onClick={() =>
              setShowMentions(
                (current) => !current
              )
            }
            title="Notificações"
            className="
              relative
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
            🔔

            {mentions.length > 0 && (
              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-4
                  w-4
                  items-center
                  justify-center
                  rounded-full
                  bg-red-600
                  text-[10px]
                  font-bold
                  text-white
                "
              >
                {mentions.length}
              </span>
            )}
          </button>

          {showMentions && (

            <div
              className="
                absolute
                right-0
                top-full
                z-50
                mt-2
                w-72
                rounded-xl
                border
                border-slate-700
                bg-slate-900
                p-2
                text-left
                shadow-xl
              "
            >

              {mentions.length === 0 ? (

                <p className="p-3 text-sm text-slate-400">
                  Nenhuma menção por
                  enquanto.
                </p>

              ) : (

                <>

                  {mentions.map((mention) => (

                    <button
                      key={mention.id}
                      onClick={() => {

                        onMentionClick?.(
                          mention.room
                        );

                        setShowMentions(false);

                      }}
                      className="
                        block
                        w-full
                        rounded-lg
                        p-2
                        text-left
                        hover:bg-slate-800
                      "
                    >

                      <div className="text-xs font-semibold text-slate-200">
                        {mention.fromNome}
                        {" · "}
                        {mention.room}
                      </div>

                      <div className="truncate text-xs text-slate-400">
                        {mention.message}
                      </div>

                    </button>

                  ))}

                  <button
                    onClick={() => {
                      onClearMentions?.();
                      setShowMentions(false);
                    }}
                    className="
                      mt-1
                      w-full
                      rounded-lg
                      p-2
                      text-center
                      text-xs
                      text-slate-400
                      hover:bg-slate-800
                    "
                  >
                    Marcar tudo como lido
                  </button>

                </>

              )}

            </div>

          )}

        </div>

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
            {emoji} {statusLabel}
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
