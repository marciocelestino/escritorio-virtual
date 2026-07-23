"use client";
import { getSocket }
from "@/lib/socket";
import Notification from "@/components/Notification";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header, {
  type Mention,
} from "@/components/Header";
import UserCard from "@/components/UserCard";
import RoomPanel, {
  type ChatMessage,
} from "@/components/RoomPanel";
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser, getSessionToken } from "@/lib/session";
import { useMounted } from "@/lib/useMounted";
import OfficeMap from "@/components/OfficeMap";
import VideoMeeting from "@/components/VideoMeeting";
import { roomSupportsCall } from "@/lib/rooms";
import { playPingSound } from "@/lib/sound";

type StatusValue =
  | "Disponivel"
  | "Ausente"
  | "Reuniao"
  | "Almoco"
  | "Ocioso";

type UserItem = {
  id: number;
  nome: string;
  email?: string;
  status?: StatusValue;
  online?: boolean;
  room: string;
  portasAbertas?: boolean;
  seat?: number | null;
  salaNome?: string | null;
  avatarTipo?: string | null;
  avatarValor?: string | null;
  isAdmin?: boolean;
};

type LivePresence = {
  room: string;
  status?: StatusValue;
  portasAbertas?: boolean;
  seat?: number | null;
};

function escapeRegExp(text: string) {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// Menção simples por primeiro nome (@primeironome) — sem lista de
// sugestão nem negrito no texto por enquanto, só o suficiente pra
// disparar a notificação.
function messageMentionsName(
  message: string,
  nome: string
) {

  const firstName = nome
    .trim()
    .split(" ")[0];

  if (!firstName) {
    return false;
  }

  const pattern = new RegExp(
    `@${escapeRegExp(firstName)}\\b`,
    "i"
  );

  return pattern.test(message);
}

export default function OfficePage() {
  const router = useRouter();

  const [currentRoom, setCurrentRoom] =
    useState("Recepção");

  const [status, setStatus] =
    useState<StatusValue>("Disponivel");

    const [currentUserId, setCurrentUserId] =
  useState<number | null>(null);

  const [portasAbertas, setPortasAbertas] =
  useState(false);

  // Sala da chamada de vídeo atual — fica fixa a partir do momento em que
  // entra numa chamada, mesmo que a pessoa navegue pra outra sala (o dock
  // flutuante continua mostrando essa chamada até ela sair de verdade).
  // null = não está em nenhuma chamada agora.
  const [callRoom, setCallRoom] =
  useState<string | null>(null);

  const [notification, setNotification] =
  useState("");

  const [roomInvite, setRoomInvite] =
  useState<{
    fromNome: string;
    room: string;
  } | null>(null);

  // Chat de texto por sala, sem persistência — as mensagens somem ao
  // recarregar a página, mas ficam guardadas por sala enquanto a pessoa
  // navega entre salas na mesma sessão.
  const [chatMessages, setChatMessages] =
  useState<
    Record<string, ChatMessage[]>
  >({});

  const [mentions, setMentions] =
  useState<Mention[]>([]);

  function sendChatMessage(text: string) {

    if (!currentUserId || !text.trim()) {
      return;
    }

    getSocket().emit("chat-message", {
      room: currentRoom,
      message: text,
    });
  }

  function clearChat() {

    if (!currentUserId) {
      return;
    }

    getSocket().emit("clear-chat", {
      room: currentRoom,
    });
  }

  const [
    usuariosColapsados,
    setUsuariosColapsados,
  ] = useState(() =>
    typeof window !== "undefined" &&
    localStorage.getItem(
      "usuariosColapsados"
    ) === "true"
  );

  useEffect(() => {

    localStorage.setItem(
      "usuariosColapsados",
      String(usuariosColapsados)
    );

  }, [usuariosColapsados]);

  // Minimiza só o corpo do chat, mantendo o cabeçalho da seção visível
  // (mesma ideia do minimizar de Usuários, mas independente).
  const [chatMinimizado, setChatMinimizado] =
    useState(() =>
      typeof window !== "undefined" &&
      localStorage.getItem(
        "chatMinimizado"
      ) === "true"
    );

  useEffect(() => {

    localStorage.setItem(
      "chatMinimizado",
      String(chatMinimizado)
    );

  }, [chatMinimizado]);

  // Fecha a barra lateral inteira (Chat + Usuários Online), devolvendo
  // toda a largura pro mapa — diferente de minimizar cada seção por
  // dentro, isso esconde a coluna toda.
  const [
    barraLateralFechada,
    setBarraLateralFechada,
  ] = useState(() =>
    typeof window !== "undefined" &&
    localStorage.getItem(
      "barraLateralFechada"
    ) === "true"
  );

  useEffect(() => {

    localStorage.setItem(
      "barraLateralFechada",
      String(barraLateralFechada)
    );

  }, [barraLateralFechada]);

  // Guarda o estado de presença mais recente pra poder reanunciar ao
  // servidor sempre que o socket reconectar (ex.: depois de uma queda de
  // rede ou um deploy no servidor) — sem isso, o socket volta com um id
  // novo que o servidor não associa a nenhum usuário, e toda troca de
  // sala/status/portas passa a ser rejeitada silenciosamente até a
  // pessoa recarregar a página.
  const presenceRef = useRef({
    room: "Recepção",
    status: "Disponivel" as StatusValue,
    portasAbertas: false,
  });

function moveToRoom(
  room: string
) {

  if (!currentUserId) {
    return;
  }

  setCurrentRoom(room);

  const socket =
  getSocket();

if (
  socket &&
  currentUserId
) {
  socket.emit(
    "room-change",
    {
      userId:
        currentUserId,
      room,
    }
  );
}

  setLiveUsers((prev) => {

    const current =
      prev[currentUserId];

    if (!current) {
      return prev;
    }

    return {
      ...prev,
      [currentUserId]: {
        ...current,
        room,
        // O servidor reatribui um lugar livre na sala nova assim que o
        // room-change chegar — zera aqui pra não mostrar por um instante
        // a pessoa "sentada" num lugar da sala antiga.
        seat: null,
      },
    };
  });
}

function chooseSeat(seat: number) {

  if (!currentUserId) {
    return;
  }

  const socket =
    getSocket();

  socket.emit(
    "seat-change",
    {
      userId: currentUserId,
      seat,
    }
  );

  setLiveUsers((prev) => {

    const current =
      prev[currentUserId];

    if (!current) {
      return prev;
    }

    return {
      ...prev,
      [currentUserId]: {
        ...current,
        seat,
      },
    };
  });
}

// Como o mapa mostra todas as salas ao mesmo tempo, clicar num lugar
// vazio de uma sala em que a pessoa ainda não está precisa fazer as duas
// coisas: mudar de sala e já sentar no lugar clicado (não só sentar em
// qualquer lugar livre, que é o que aconteceria só com moveToRoom).
function handleSeatClick(
  room: string,
  seat: number
) {

  if (room !== currentRoom) {
    moveToRoom(room);
  }

  chooseSeat(seat);
}

function showNotification(
  message: string
) {
  setNotification(message);

  setTimeout(() => {
    setNotification("");
  }, 3000);
}

  const mounted = useMounted();

 const [roster, setRoster] =
  useState<UserItem[]>([]);

  const [liveUsers, setLiveUsers] =
  useState<
    Record<number, LivePresence>
  >({});

  const allUsers = useMemo(() => {
    return roster.map((user) => {
      const live = liveUsers[user.id];

      if (!live) {
        return {
          ...user,
          online: false,
        };
      }

      return {
        ...user,
        room: live.room,
        status: live.status,
        portasAbertas: live.portasAbertas,
        seat: live.seat,
        online: true,
      };
    });
  }, [roster, liveUsers]);

  const onlineUsers = useMemo(() => {
  return allUsers.filter(
    (user) => user.online !== false
  );
}, [allUsers]);

  useEffect(() => {

  const socket =
  getSocket();

  const user =
  getSessionUser();

if (!user) {
  router.push("/");
  return;
}

fetch("/api/users")
  .then((res) => res.json())
  .then((users) => {
    setRoster(
      users as UserItem[]
    );
  })
  .catch((error) => {
    console.error(
      "Erro ao carregar usuários:",
      error
    );
  });

  const savedStatus =
    localStorage.getItem("status");

  const validStatuses: StatusValue[] = [
    "Disponivel",
    "Ausente",
    "Reuniao",
    "Almoco",
    "Ocioso",
  ];

  const initialStatus: StatusValue =
    validStatuses.includes(
      savedStatus as StatusValue
    )
      ? (savedStatus as StatusValue)
      : "Disponivel";

  const initialPortasAbertas =
    localStorage.getItem("portasAbertas") ===
    "true";

  presenceRef.current = {
    room: currentRoom,
    status: initialStatus,
    portasAbertas: initialPortasAbertas,
  };

  function announcePresence() {

    socket.emit(
      "user-connected",
      {
        id: user.id,
        nome: user.nome,
        room: presenceRef.current.room,
        status: presenceRef.current.status,
        portasAbertas:
          presenceRef.current
            .portasAbertas,
        token: getSessionToken(),
      }
    );

  }

socket.on(
  "connect",
  () => {

    console.log(
      "Socket conectado:",
      socket.id
    );

    // Também roda em reconexões (não só na primeira vez) — sem isso, o
    // servidor não reassocia o socket novo ao usuário, e room-change/
    // status-change passam a ser rejeitados até a página ser recarregada.
    announcePresence();

  }
);

if (socket.connected) {
  announcePresence();
}

socket.on(
  "presence-update",
  (users: Array<{
    id: number;
    room: string;
    status?: LivePresence["status"];
    portasAbertas?: boolean;
    seat?: number | null;
  }>) => {

    const map: Record<
      number,
      LivePresence
    > = {};

    users.forEach((liveUser) => {
      map[liveUser.id] = {
        room: liveUser.room,
        status: liveUser.status,
        portasAbertas: liveUser.portasAbertas,
        seat: liveUser.seat,
      };
    });

    setLiveUsers(map);

  }
);

socket.on(
  "poked",
  ({
    fromNome,
  }: {
    fromNome: string;
  }) => {

    playPingSound();

    showNotification(
      `🔔 ${fromNome} quer falar com você!`
    );

  }
);

socket.on(
  "invited-to-room",
  ({
    fromNome,
    room,
  }: {
    fromNome: string;
    room: string;
  }) => {

    playPingSound();

    setRoomInvite({ fromNome, room });

  }
);

socket.on(
  "chat-message",
  (msg: ChatMessage & { room: string }) => {

    setChatMessages((prev) => ({
      ...prev,
      [msg.room]: [
        ...(prev[msg.room] ?? []),
        {
          fromId: msg.fromId,
          fromNome: msg.fromNome,
          message: msg.message,
          at: msg.at,
        },
      ].slice(-200),
    }));

    if (
      msg.fromId !== user.id &&
      messageMentionsName(
        msg.message,
        user.nome
      )
    ) {

      setMentions((prev) =>
        [
          {
            id: `${msg.room}-${msg.at}-${msg.fromId}`,
            room: msg.room,
            fromNome: msg.fromNome,
            message: msg.message,
            at: msg.at,
          },
          ...prev,
        ].slice(0, 20)
      );

    }

  }
);

socket.on(
  "chat-cleared",
  ({ room }: { room: string }) => {

    setChatMessages((prev) => ({
      ...prev,
      [room]: [],
    }));

  }
);

socket.on(
  "chat-clear-denied",
  () => {

    showNotification(
      "Você não tem permissão pra limpar o chat dessa sala."
    );

  }
);

setCurrentUserId(
  user.id
);

  setStatus(initialStatus);
  setPortasAbertas(initialPortasAbertas);

  // Conecta o socket uma única vez, no valor de currentRoom no momento da
  // montagem — incluir currentRoom nas deps re-registraria os listeners do
  // socket a cada troca de sala, duplicando-os.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [router]);

  useEffect(() => {

    presenceRef.current = {
      room: currentRoom,
      status,
      portasAbertas,
    };

  }, [currentRoom, status, portasAbertas]);

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "status",
      status
    );

  }, [status, mounted]);

  useEffect(() => {

    if (!mounted || !currentUserId) return;

    const socket = getSocket();

    socket.emit(
      "status-change",
      {
        userId: currentUserId,
        status,
      }
    );

  }, [status, currentUserId, mounted]);

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "portasAbertas",
      String(portasAbertas)
    );

  }, [portasAbertas, mounted]);

  useEffect(() => {

    if (!mounted || !currentUserId) return;

    const socket = getSocket();

    socket.emit(
      "door-toggle",
      {
        userId: currentUserId,
        aberta: portasAbertas,
      }
    );

  }, [portasAbertas, currentUserId, mounted]);

  // O status só muda quando a própria pessoa escolhe no seletor — já
  // tivemos um comportamento automático aqui (mudar pra "Disponível" ao
  // mexer o mouse, "Ausente" depois de inatividade) que foi removido a
  // pedido: o status é uma escolha da pessoa, não algo que o sistema
  // decide por ela.

  if (!mounted) {
    return null;
  }

  // Enquanto não estiver em nenhuma chamada, o dock representa a sala que
  // está sendo vista agora. Assim que entra numa chamada, `callRoom` fica
  // fixo naquela sala — navegar pra outra sala não muda mais o `room` da
  // chamada, só o que aparece no resto da tela (é isso que faz o dock
  // sobreviver à navegação).
  const videoRoom =
    callRoom ?? currentRoom;

  // Com uma chamada em andamento o dock sempre aparece (mesmo se a sala
  // que está sendo vista agora não suporta chamada própria); sem chamada,
  // só aparece nas salas que suportam.
  const showVideoDock =
    callRoom !== null ||
    roomSupportsCall(currentRoom);

  const currentRoomUsers =
    onlineUsers.filter(
      (user) => user.room === currentRoom
    );

  const someoneElseWithOpenDoor =
    currentRoomUsers.some(
      (user) =>
        user.id !== currentUserId &&
        user.portasAbertas
    );

  const autoJoinCall = Boolean(
    callRoom === null &&
      roomSupportsCall(currentRoom) &&
      currentRoomUsers.find(
        (user) => user.id === currentUserId
      )?.portasAbertas &&
      someoneElseWithOpenDoor
  );

  const myself = allUsers.find(
    (user) => user.id === currentUserId
  );

  const viewingDifferentRoom = Boolean(
    callRoom !== null &&
      callRoom !== currentRoom
  );

  return (

    <main className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      {notification && (
        <Notification
          message={notification}
        />
)}

      {roomInvite && (

        <div
          className="
            fixed
            top-5
            right-5
            z-[60]
            rounded-xl
            bg-indigo-600
            px-5
            py-4
            text-white
            shadow-xl
          "
        >

          <p>
            🔔 {roomInvite.fromNome} te
            chamou para {roomInvite.room}
          </p>

          <div className="mt-3 flex gap-2">

            <button
              onClick={() => {
                moveToRoom(roomInvite.room);
                setRoomInvite(null);
              }}
              className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Ir até lá
            </button>

            <button
              onClick={() =>
                setRoomInvite(null)
              }
              className="rounded-lg bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-400"
            >
              Ignorar
            </button>

          </div>

        </div>

      )}

      <Header
        mentions={mentions}
        onMentionClick={(room) => {
          moveToRoom(room);
          setMentions([]);
        }}
        onClearMentions={() =>
          setMentions([])
        }
      />

      <div className="flex flex-1 overflow-hidden">

        {showVideoDock && (

          <VideoMeeting
            room={videoRoom}
            autoJoin={autoJoinCall}
            onNotify={showNotification}
            onJoined={() =>
              setCallRoom(currentRoom)
            }
            onLeft={() =>
              setCallRoom(null)
            }
            myNome={myself?.nome}
            myAvatarTipo={myself?.avatarTipo}
            myAvatarValor={myself?.avatarValor}
            roster={allUsers}
            viewingDifferentRoom={
              viewingDifferentRoom
            }
            onGoToCallRoom={() => {
              if (callRoom) {
                moveToRoom(callRoom);
              }
            }}
            sidebarWidthPx={
              barraLateralFechada ? 0 : 320
            }
            onOpenChat={() => {
              setBarraLateralFechada(false);
              setChatMinimizado(false);
            }}
          />

        )}

        <section
          className="
            flex-1
            overflow-y-auto
            p-5
          "
        >

          <div
            className="
              mb-4
              flex
              items-center
              justify-end
              gap-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <span
                className="
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Meu status
              </span>

              <StatusSelector
                status={status}
                setStatus={setStatus}
              />

              <button
                onClick={() =>
                  setPortasAbertas(
                    (prev) => !prev
                  )
                }
                title="Quando ligado, colegas que também estiverem com as portas abertas na mesma sala conectam áudio automaticamente com você, sem precisar clicar em Entrar na Chamada."
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-sm
                  font-medium
                  ${
                    portasAbertas
                      ? "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }
                `}
              >
                {portasAbertas
                  ? "🚪 Portas abertas"
                  : "🚪 Portas fechadas"}
              </button>

              <button
                onClick={() =>
                  setBarraLateralFechada(
                    (current) => !current
                  )
                }
                title={
                  barraLateralFechada
                    ? "Mostrar barra lateral"
                    : "Fechar barra lateral"
                }
                className="
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-slate-600
                  hover:bg-slate-100
                  dark:border-slate-600
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                {barraLateralFechada
                  ? "»"
                  : "«"}
              </button>

            </div>

          </div>

          <div className="mb-4">

            <OfficeMap
              users={allUsers}
              currentUserId={currentUserId ?? 0}
              onUserClick={(userId, name) => {

                getSocket().emit(
                  "poke",
                  { to: userId }
                );

                showNotification(
                  `Você chamou ${name}`
                );

              }}
              onSeatClick={handleSeatClick}
            />

          </div>

        </section>

        <aside
          className={`
            relative
            z-50
            flex
            shrink-0
            flex-col
            overflow-hidden
            bg-white
            transition-all
            dark:bg-slate-900
            ${
              barraLateralFechada
                ? "w-0"
                : "w-80 border-l dark:border-white/10"
            }
          `}
        >

          <div className="shrink-0 overflow-y-auto p-4">

            <RoomPanel
              room={currentRoom}
              users={allUsers}
              currentUserId={currentUserId}
              messages={
                chatMessages[currentRoom] ?? []
              }
              onSendMessage={sendChatMessage}
              onClearChat={clearChat}
              minimized={chatMinimizado}
              onToggleMinimized={() =>
                setChatMinimizado(
                  (current) => !current
                )
              }
            />

          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t dark:border-white/10">

            <button
              onClick={() =>
                setUsuariosColapsados(
                  (current) => !current
                )
              }
              className="
                flex
                w-full
                shrink-0
                items-center
                justify-between
                border-b
                p-4
                font-bold
                text-slate-900
                hover:bg-slate-50
                dark:border-white/10
                dark:text-slate-100
                dark:hover:bg-slate-800
              "
            >
              Online ({onlineUsers.length})

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
                {usuariosColapsados ? "+" : "−"}
              </span>
            </button>

            {!usuariosColapsados &&
              onlineUsers.map((user) => (

              <UserCard
                key={user.id}
                nome={user.nome}
                status={user.status}
                room={
                  user.room !== currentRoom
                    ? user.room
                    : undefined
                }
                onInvite={
                  user.id !== currentUserId &&
                  user.room !== currentRoom
                    ? () => {

                        getSocket().emit(
                          "invite-to-room",
                          {
                            to: user.id,
                            room: currentRoom,
                          }
                        );

                        showNotification(
                          `Convite enviado para ${user.nome}.`
                        );

                      }
                    : undefined
                }
              />

            ))}

          </div>

        </aside>

      </div>

    </main>
  );
}