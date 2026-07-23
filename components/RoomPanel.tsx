"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

export type ChatMessage = {
  fromId: number;
  fromNome: string;
  message: string;
  at: number;
};

type Props = {
  room: string;
  users: User[];
  currentUserId: number | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
};

const STATUS_COLOR: Record<string, string> = {
  Disponivel: "bg-green-500",
  Ausente: "bg-yellow-500",
  Reuniao: "bg-red-500",
  Almoco: "bg-orange-500",
  Ocioso: "bg-slate-400",
};

export default function RoomPanel({
  room,
  users,
  currentUserId,
  messages,
  onSendMessage,
  onClearChat,
}: Props) {

  const [tab, setTab] = useState<
    "participantes" | "chat"
  >("participantes");

  const [draft, setDraft] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const usersInRoom = users.filter(
    (user) => user.room === room
  );

  // Sempre mostra as mensagens mais recentes sem precisar rolar —
  // acompanha tanto mensagens novas quanto trocar pra aba do chat.
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      block: "end",
    });

  }, [messages, tab]);

  function handleSend(
    event: React.FormEvent
  ) {

    event.preventDefault();

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
        mt-6
        rounded-2xl
        border
        bg-white
        shadow-sm
        dark:border-white/10
        dark:bg-slate-900
      "
    >

      <div className="flex border-b dark:border-white/10">

        <button
          onClick={() =>
            setTab("participantes")
          }
          className={`
            flex-1
            px-4
            py-3
            text-sm
            font-medium
            ${
              tab === "participantes"
                ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }
          `}
        >
          Participantes ({usersInRoom.length})
        </button>

        <button
          onClick={() => setTab("chat")}
          className={`
            flex-1
            px-4
            py-3
            text-sm
            font-medium
            ${
              tab === "chat"
                ? "border-b-2 border-blue-600 text-blue-700 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }
          `}
        >
          Chat
          {messages.length > 0 &&
            ` (${messages.length})`}
        </button>

      </div>

      {tab === "participantes" && (

        <div
          className="
            max-h-72
            overflow-y-auto
            p-2
          "
        >

          {usersInRoom.length === 0 && (

            <p
              className="
                p-3
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Nenhum usuário presente.
            </p>

          )}

          {usersInRoom.map((user) => {

            const initials =
              user.nome
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

            return (

              <div
                key={user.id}
                className="
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  p-2
                  hover:bg-slate-50
                  dark:hover:bg-slate-700
                "
              >

                <div
                  className="
                    relative
                    flex
                    h-9
                    w-9
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

                  {user.avatarTipo === "foto" &&
                  user.avatarValor ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarValor}
                      alt={user.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : user.avatarTipo ===
                      "emoji" &&
                    user.avatarValor ? (
                    <span className="text-base">
                      {user.avatarValor}
                    </span>
                  ) : (
                    initials
                  )}

                  <span
                    className={`
                      absolute
                      -bottom-0.5
                      -right-0.5
                      h-2.5
                      w-2.5
                      rounded-full
                      border-2
                      border-white
                      dark:border-slate-800
                      ${
                        STATUS_COLOR[
                          user.status ?? ""
                        ] ?? "bg-slate-300"
                      }
                    `}
                  />

                </div>

                <span
                  className="
                    truncate
                    text-sm
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {user.nome}
                  {user.id === currentUserId &&
                    " (Você)"}
                </span>

              </div>

            );

          })}

        </div>

      )}

      {tab === "chat" && (

        <div className="flex h-96 flex-col">

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

            {messages.map((msg, index) => (

              <div key={index} className="text-sm">

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

                <p className="text-slate-600 dark:text-slate-300">
                  {msg.message}
                </p>

              </div>

            ))}

            <div ref={messagesEndRef} />

          </div>

          <form
            onSubmit={handleSend}
            className="
              flex
              gap-2
              border-t
              p-2
              dark:border-white/10
            "
          >

            <input
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value)
              }
              placeholder="Mensagem para a sala..."
              title="Digite \clear e envie pra apagar o histórico desta sala (se você tiver permissão)"
              maxLength={500}
              className="
                flex-1
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
                rounded-lg
                bg-blue-600
                px-4
                py-2
                text-sm
                text-white
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
