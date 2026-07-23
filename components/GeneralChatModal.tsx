"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { renderRichText } from "@/lib/richText";

type ChatMessage = {
  id: string;
  fromId: number;
  fromNome: string;
  message: string;
  at: number;
};

type Props = {
  currentUserId: number;
  canClear: boolean;
  onClose: () => void;
};

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (value: string) => void,
  before: string,
  after: string,
  placeholder: string
) {

  const start =
    textarea.selectionStart ?? value.length;

  const end =
    textarea.selectionEnd ?? value.length;

  const selected =
    value.slice(start, end) || placeholder;

  const newValue =
    value.slice(0, start) +
    before +
    selected +
    after +
    value.slice(end);

  onChange(newValue);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + before.length,
      start +
        before.length +
        selected.length
    );
  });
}

// Chat geral da empresa — uma conversa só, visível pra todo mundo,
// independente de sala. Tem um editor pequeno (negrito/sublinhado/link)
// que grava um texto simples com marcadores (**negrito**, __sublinhado__,
// [texto](url)) — ver lib/richText.tsx pra como isso vira formatação na
// tela sem nunca passar por HTML cru.
export default function GeneralChatModal({
  currentUserId,
  canClear,
  onClose,
}: Props) {

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([]);

  const [draft, setDraft] = useState("");

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {

    const socket = getSocket();

    socket.emit("load-general-chat-history");

    function handleHistory({
      messages: history,
    }: {
      messages: ChatMessage[];
    }) {
      setMessages(history);
    }

    function handleMessage(
      msg: ChatMessage
    ) {

      setMessages((prev) => {

        if (
          prev.some((m) => m.id === msg.id)
        ) {
          return prev;
        }

        return [...prev, msg].slice(-200);

      });

    }

    function handleCleared() {
      setMessages([]);
    }

    socket.on(
      "general-chat-history",
      handleHistory
    );

    socket.on(
      "general-chat-message",
      handleMessage
    );

    socket.on(
      "general-chat-cleared",
      handleCleared
    );

    return () => {
      socket.off(
        "general-chat-history",
        handleHistory
      );
      socket.off(
        "general-chat-message",
        handleMessage
      );
      socket.off(
        "general-chat-cleared",
        handleCleared
      );
    };

  }, []);

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

    getSocket().emit(
      "general-chat-message",
      { message: trimmed }
    );

    setDraft("");
  }

  function handleClear() {

    if (
      !confirm(
        "Apagar todo o histórico do Chat Geral pra sempre? Essa ação não pode ser desfeita."
      )
    ) {
      return;
    }

    getSocket().emit("clear-general-chat");
  }

  function applyFormat(
    before: string,
    after: string,
    placeholder: string
  ) {

    const el = textareaRef.current;

    if (!el) {
      return;
    }

    wrapSelection(
      el,
      draft,
      setDraft,
      before,
      after,
      placeholder
    );

  }

  function applyLink() {

    const el = textareaRef.current;

    if (!el) {
      return;
    }

    const start =
      el.selectionStart ?? draft.length;

    const end =
      el.selectionEnd ?? draft.length;

    const selected =
      draft.slice(start, end) || "link";

    const url = window.prompt(
      "Endereço do link (https://...)"
    );

    if (!url) {
      return;
    }

    const trimmedUrl = url.trim();

    const safeUrl = /^(https?:|mailto:)/i.test(
      trimmedUrl
    )
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    const newValue =
      draft.slice(0, start) +
      `[${selected}](${safeUrl})` +
      draft.slice(end);

    setDraft(newValue);

    requestAnimationFrame(() => {
      el.focus();
    });

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
          h-[36rem]
          w-full
          max-w-lg
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

          <h2 className="font-bold text-slate-900 dark:text-slate-100">
            💬 Chat Geral
          </h2>

          <div className="flex items-center gap-3">

            {canClear && (
              <button
                onClick={handleClear}
                title="Limpar o chat geral"
                className="text-xs text-red-500 hover:underline"
              >
                🧹 Limpar
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              ✕
            </button>

          </div>

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
              Nenhuma mensagem ainda no chat
              geral.
            </p>

          )}

          {messages.map((msg) => (

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
                {renderRichText(msg.message)}
              </p>

            </div>

          ))}

          <div ref={messagesEndRef} />

        </div>

        <div className="border-t p-2 dark:border-white/10">

          <div className="mb-2 flex gap-1">

            <button
              type="button"
              onClick={() =>
                applyFormat(
                  "**",
                  "**",
                  "negrito"
                )
              }
              title="Negrito"
              className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-2
                py-1
                text-xs
                font-bold
                text-slate-700
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-300
              "
            >
              B
            </button>

            <button
              type="button"
              onClick={() =>
                applyFormat(
                  "__",
                  "__",
                  "sublinhado"
                )
              }
              title="Sublinhado"
              className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-2
                py-1
                text-xs
                font-semibold
                text-slate-700
                underline
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-300
              "
            >
              U
            </button>

            <button
              type="button"
              onClick={applyLink}
              title="Link"
              className="
                rounded-lg
                border
                border-slate-300
                bg-white
                px-2
                py-1
                text-xs
                font-medium
                text-slate-700
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-300
              "
            >
              🔗
            </button>

          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Mensagem pro chat geral..."
              maxLength={1000}
              rows={2}
              className="
                flex-1
                resize-none
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                py-2
                text-sm
                text-slate-900
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-100
              "
            />

            <button
              type="submit"
              className="
                self-end
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

    </div>
  );
}
