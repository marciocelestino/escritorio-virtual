"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import MentionInput from "./MentionInput";
import { type ChatMessage } from "./RoomPanel";

type OtherUser = {
  id: number;
  nome: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

type Props = {
  currentUserId: number;
  otherUser: OtherUser;
  roster?: { id: number; nome: string }[];
  onClose: () => void;
};

function avatarInitials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Conversa privada (1:1) — modal próprio, separado do chat de sala. Pede
// o histórico persistido ao abrir e escuta mensagens novas em tempo
// real, só as que envolvem essa pessoa (o servidor nunca manda DM de
// outra conversa pra cá).
export default function DirectMessageModal({
  currentUserId,
  otherUser,
  roster = [],
  onClose,
}: Props) {

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([]);

  const [draft, setDraft] = useState("");

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {

    const socket = getSocket();

    socket.emit("load-chat-history", {
      withUserId: otherUser.id,
    });

    function handleHistory({
      withUserId,
      messages: history,
    }: {
      room?: string;
      withUserId?: number;
      messages: ChatMessage[];
    }) {

      if (withUserId !== otherUser.id) {
        return;
      }

      setMessages(history);

    }

    function handleDm(
      msg: ChatMessage & {
        toUserId: number;
      }
    ) {

      const involvesThisConversation =
        (msg.fromId === otherUser.id &&
          msg.toUserId === currentUserId) ||
        (msg.fromId === currentUserId &&
          msg.toUserId === otherUser.id);

      if (!involvesThisConversation) {
        return;
      }

      setMessages((prev) => {

        if (
          prev.some((m) => m.id === msg.id)
        ) {
          return prev;
        }

        return [
          ...prev,
          {
            id: msg.id,
            fromId: msg.fromId,
            fromNome: msg.fromNome,
            message: msg.message,
            at: msg.at,
          },
        ];

      });

    }

    socket.on("chat-history", handleHistory);
    socket.on("dm-message", handleDm);

    return () => {
      socket.off(
        "chat-history",
        handleHistory
      );
      socket.off("dm-message", handleDm);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUser.id]);

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      block: "end",
    });

  }, [messages]);

  function handleSend() {

    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    getSocket().emit("dm-message", {
      toUserId: otherUser.id,
      message: trimmed,
    });

    setDraft("");

  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
    >
      <div
        className="
          flex
          h-[32rem]
          w-full
          max-w-md
          flex-col
          rounded-2xl
          bg-white
          shadow-xl
          dark:bg-slate-900
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            gap-2
            border-b
            p-4
            dark:border-white/10
          "
        >

          <div className="flex items-center gap-2">

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

              {otherUser.avatarTipo ===
                "foto" &&
              otherUser.avatarValor ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.avatarValor}
                  alt={otherUser.nome}
                  className="h-full w-full object-cover"
                />
              ) : otherUser.avatarTipo ===
                  "emoji" &&
                otherUser.avatarValor ? (
                <span className="text-sm">
                  {otherUser.avatarValor}
                </span>
              ) : (
                avatarInitials(
                  otherUser.nome
                )
              )}

            </div>

            <h2 className="font-bold text-slate-900 dark:text-slate-100">
              {otherUser.nome}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            ✕
          </button>

        </div>

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
              Nenhuma mensagem ainda com{" "}
              {otherUser.nome}.
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
                className="text-sm"
              >

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

                <p className="break-words text-slate-600 dark:text-slate-300">
                  {msg.message}
                </p>

              </div>

            )

          )}

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
            roster={roster}
            placeholder={`Mensagem para ${otherUser.nome}...`}
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

    </div>
  );
}
