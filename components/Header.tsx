"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import MeusDados from "@/components/MeusDados";
import AdminPanel from "@/components/AdminPanel";
import GeneralChatModal from "@/components/GeneralChatModal";
import { useDarkMode } from "@/lib/useDarkMode";

// Só essa pessoa pode limpar o Chat Geral — a mesma regra que o servidor
// confere de novo antes de aceitar (ver server.js,
// GENERAL_CHAT_CLEAR_ALLOWED_NAME). Isso aqui só controla se o botão de
// limpar aparece; quem decide de verdade é o servidor.
const GENERAL_CHAT_CLEAR_ALLOWED_NAME =
  "Marcio Celestino";

export type Mention = {
  id: string;
  room: string;
  fromNome: string;
  message: string;
  at: number;
  // Ausente (ou "room") = menção numa sala/DM, tratada por onMentionClick.
  // "general" = menção no Chat Geral, que não tem sala pra ir — só abre
  // o próprio modal aqui dentro.
  kind?: "room" | "general";
};

type RosterUser = {
  id: number;
  nome: string;
};

type Props = {
  mentions?: Mention[];
  onMentionClick?: (room: string) => void;
  onClearMentions?: () => void;
  roster?: RosterUser[];
};

export default function Header({
  mentions = [],
  onMentionClick,
  onClearMentions,
  roster = [],
}: Props) {
  const router = useRouter();

  const user = getSessionUser();

  const [showMeusDados, setShowMeusDados] =
    useState(false);

  // Modal em vez de navegar pra /admin — navegar derrubava a chamada de
  // vídeo em andamento (a página /office inteira desmontava).
  const [showAdminPanel, setShowAdminPanel] =
    useState(false);

  const [
    showGeneralChat,
    setShowGeneralChat,
  ] = useState(false);

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
        border-white/10
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
        <button
          onClick={() =>
            setShowGeneralChat(true)
          }
          title="Chat Geral"
          aria-label="Chat Geral"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-[#007CB2]
            text-lg
            text-white
            shadow-md
            transition
            hover:brightness-110
          "
        >
          💬
        </button>

        {user?.isAdmin && (
          <button
            onClick={() =>
              setShowAdminPanel(true)
            }
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
          </button>
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
                z-[60]
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

                        if (
                          mention.kind ===
                          "general"
                        ) {
                          setShowGeneralChat(
                            true
                          );
                        } else {
                          onMentionClick?.(
                            mention.room
                          );
                        }

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
                        {mention.kind ===
                        "general"
                          ? "Chat Geral"
                          : mention.room}
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

      {showGeneralChat && user && (
        <GeneralChatModal
          currentUserId={user.id}
          canClear={
            user.nome ===
            GENERAL_CHAT_CLEAR_ALLOWED_NAME
          }
          roster={roster}
          onClose={() =>
            setShowGeneralChat(false)
          }
        />
      )}

      {showAdminPanel && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-start
            justify-center
            overflow-y-auto
            bg-black/40
            p-4
          "
        >
          <div
            className="
              my-8
              w-full
              max-w-3xl
              rounded-2xl
              bg-slate-100
              p-6
              shadow-xl
            "
          >
            <AdminPanel
              onClose={() =>
                setShowAdminPanel(false)
              }
            />
          </div>
        </div>
      )}
    </header>
  );
}
