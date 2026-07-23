"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import MentionInput from "./MentionInput";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

export type ChatMessage = {
  id: string;
  fromId: number;
  fromNome: string;
  message: string;
  at: number;
  // Mensagem gerada pelo sistema (ex.: aviso de cutucão perdido enquanto
  // offline) — mostrada sem avatar/nome, num estilo mais discreto.
  system?: boolean;
};

type Props = {
  room: string;
  users: User[];
  currentUserId: number | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  minimized: boolean;
  onToggleMinimized: () => void;
};

function avatarInitials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function MessageAvatar({
  user,
  fallbackNome,
}: {
  user?: User;
  fallbackNome: string;
}) {

  const nome = user?.nome ?? fallbackNome;

  return (
    <div
      className="
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-full
        bg-blue-600
        text-xs
        font-bold
        text-white
      "
    >

      {user?.avatarTipo === "foto" &&
      user.avatarValor ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarValor}
          alt={nome}
          className="h-full w-full object-cover"
        />
      ) : user?.avatarTipo === "emoji" &&
        user.avatarValor ? (
        <span className="text-sm">
          {user.avatarValor}
        </span>
      ) : (
        avatarInitials(nome)
      )}

    </div>
  );
}

export default function RoomPanel({
  room,
  users,
  currentUserId,
  messages,
  onSendMessage,
  onClearChat,
  minimized,
  onToggleMinimized,
}: Props) {

  const [draft, setDraft] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  // Sempre mostra as mensagens mais recentes sem precisar rolar.
  useEffect(() => {

    if (minimized) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      block: "end",
    });

  }, [messages, minimized]);

  function handleSend() {

    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    if (trimmed === "\\clear") {
      onClearChat();
      setDraft("");
      return;
    }

    onSendMessage(trimmed);
    setDraft("");

  }

  return (
    <div
      className="
        rounded-2xl
        border
        bg-white
        shadow-sm
        dark:border-white/10
        dark:bg-slate-900
      "
    >

      <button
        onClick={onToggleMinimized}
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-t-2xl
          p-4
          font-bold
          text-slate-900
          hover:bg-slate-50
          dark:text-slate-100
          dark:hover:bg-slate-800
        "
      >
        <span>
          💬 Chat
          {room && ` · ${room}`}
        </span>

        <span
          className="
            flex
            h-5
            w-5
            items-center
            justify-center
            rounded-full
            bg-slate-200
            text-sm
            leading-none
            text-slate-600
            dark:bg-slate-700
            dark:text-slate-300
          "
        >
          {minimized ? "+" : "−"}
        </span>
      </button>

      {!minimized && (

        <div className="flex h-96 flex-col border-t dark:border-white/10">

          <div
            className="
              flex-1
              space-y-3
              overflow-y-auto
              p-3
            "
          >

            {messages.length === 0 && (

              <p className="text-sm text-slate-400 dark:text-slate-500">
                Nenhuma mensagem ainda nesta
                sala.
              </p>

            )}

            {messages.map((msg) =>

              msg.system ? (

                <p
                  key={msg.id}
                  className="text-center text-xs italic text-slate-400 dark:text-slate-500"
                >
                  🔔 {msg.message}
                </p>

              ) : (

              <div
                key={msg.id}
                className="flex items-start gap-2 text-sm"
              >

                <MessageAvatar
                  user={users.find(
                    (user) =>
                      user.id === msg.fromId
                  )}
                  fallbackNome={msg.fromNome}
                />

                <div className="min-w-0 flex-1">

                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {msg.fromId === currentUserId
                        ? "Você"
                        : msg.fromNome}
                    </span>

                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(
                        msg.at
                      ).toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <p className="break-words text-slate-600 dark:text-slate-300">
                    {msg.message}
                  </p>

                </div>

              </div>

            ))}

            <div ref={messagesEndRef} />

          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
            className="
              flex
              gap-2
              border-t
              p-2
              dark:border-white/10
            "
          >

            <MentionInput
              value={draft}
              onChange={setDraft}
              onSubmit={handleSend}
              roster={users}
              placeholder="Mensagem para a sala... (@ pra mencionar)"
              title="Digite \clear e envie pra apagar o histórico desta sala (se você tiver permissão)"
            />

            <button
              type="submit"
              className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-900
                transition
                hover:bg-slate-50
              "
            >
              Enviar
            </button>

          </form>

        </div>

      )}

    </div>
  );
}
