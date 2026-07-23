"use client";
import { getSocket }
from "@/lib/socket";
import Notification from "@/components/Notification";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserCard from "@/components/UserCard";
import RoomPanel, {
  type ChatMessage,
} from "@/components/RoomPanel";
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser, getSessionToken } from "@/lib/session";
import { useMounted } from "@/lib/useMounted";
import OfficeMap from "@/components/OfficeMap";
import VideoMeeting from "@/components/VideoMeeting";
import {
  roomSupportsCall,
  buildRoomList,
} from "@/lib/rooms";
import { playPingSound } from "@/lib/sound";

type UserItem = {
  id: number;
  nome: string;
  email?: string;
  status?:
    | "Disponivel"
    | "Ausente"
    | "Reuniao";
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
  status?:
    | "Disponivel"
    | "Ausente"
    | "Reuniao";
  portasAbertas?: boolean;
  seat?: number | null;
};

export default function OfficePage() {
  const router = useRouter();

  const [currentRoom, setCurrentRoom] =
    useState("Recepção");

  const [status, setStatus] =
    useState<
      "Disponivel" |
      "Ausente" |
      "Reuniao"
    >("Disponivel");

    const [lastActivity, setLastActivity] =
  useState(() => Date.now());

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

  function sendChatMessage(text: string) {

    if (!currentUserId || !text.trim()) {
      return;
    }

    getSocket().emit("chat-message", {
      room: currentRoom,
      message: text,
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

  // Guarda o estado de presença mais recente pra poder reanunciar ao
  // servidor sempre que o socket reconectar (ex.: depois de uma queda de
  // rede ou um deploy no servidor) — sem isso, o socket volta com um id
  // novo que o servidor não associa a nenhum usuário, e toda troca de
  // sala/status/portas passa a ser rejeitada silenciosamente até a
  // pessoa recarregar a página.
  const presenceRef = useRef({
    room: "Recepção",
    status: "Disponivel" as
      | "Disponivel"
      | "Ausente"
      | "Reuniao",
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

  const initialStatus =
    savedStatus === "Disponivel" ||
    savedStatus === "Ausente" ||
    savedStatus === "Reuniao"
      ? savedStatus
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

  useEffect(() => {

  const updateActivity = () => {

    setLastActivity(Date.now());

    setStatus((current) => {

      if (current === "Reuniao") {
        return current;
      }

      return "Disponivel";
    });
  };

  window.addEventListener(
    "mousemove",
    updateActivity
  );

  window.addEventListener(
    "keydown",
    updateActivity
  );

  return () => {

    window.removeEventListener(
      "mousemove",
      updateActivity
    );

    window.removeEventListener(
      "keydown",
      updateActivity
    );
  };

}, []);

useEffect(() => {

  const interval = setInterval(() => {

    const inactiveTime =
      Date.now() - lastActivity;

    if (
      inactiveTime >
      2 * 60 * 1000
    ) {

      setStatus((current) => {

        if (current === "Reuniao") {
          return current;
        }

        return "Ausente";
      });
    }

  }, 10000);

  return () =>
    clearInterval(interval);

}, [lastActivity]);

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

  const allRoomNames = buildRoomList(
    allUsers
  ).map((room) => room.nome);

  const roomsLivres = allRoomNames.filter(
    (roomName) =>
      !onlineUsers.some(
        (user) => user.room === roomName
      )
  ).length;

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

      <Header />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
  currentRoom={currentRoom}
  users={allUsers}
  onRoomChange={moveToRoom}
/>

        <section
          className="
            flex-1
            overflow-y-auto
            p-8
          "
        >

          <div
            className="
              mb-6
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <div>

              <h2
                className="
                  text-4xl
                  font-bold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Escritório Internit
              </h2>

              <p
                className="
                  mt-2
                  text-xl
                  text-slate-600
                  dark:text-slate-400
                "
              >
                {roomsLivres} salas livres
                {" · "}
                {onlineUsers.length}
                {" "}
                pessoas online
              </p>

            </div>

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

            </div>

          </div>

          <div className="mb-8">

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

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            <div
              className="
                rounded-2xl
                border
                bg-white
                p-5
                shadow-sm
                dark:border-slate-700
                dark:bg-slate-900
              "
            >

              <h4
                className="
                  font-semibold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Evolução Futura
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Ideias para as próximas fases:
                responsividade para celular,
                webapp instalável (PWA),
                chat privado e em grupo com @menção,
                central de notificações,
                busca global,
                piso com visual mais próximo do mockup enviado,
                gravação de reuniões,
                cargos e salas restritas por equipe,
                plano de fundo da câmera,
                e compartilhamento de tela aprimorado.
              </p>

            </div>

            <div
              className="
                rounded-2xl
                border
                bg-white
                p-5
                shadow-sm
                dark:border-slate-700
                dark:bg-slate-900
              "
            >

              <h4
                className="
                  font-semibold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Usuários Online
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-600
                  dark:text-slate-400
                "
              >
                {onlineUsers.length}
                {" "}
                usuários ativos.
              </p>

            </div>

          </div>

        </section>

        <aside
          className="
            relative
            z-50
            flex
            w-80
            shrink-0
            flex-col
            border-l
            bg-white
            dark:border-slate-700
            dark:bg-slate-900
          "
        >

          <div className="shrink-0 overflow-y-auto p-4">

            <RoomPanel
              room={currentRoom}
              users={onlineUsers}
              currentUserId={currentUserId}
              messages={
                chatMessages[currentRoom] ?? []
              }
              onSendMessage={sendChatMessage}
            />

          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t dark:border-slate-700">

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
                dark:border-slate-700
                dark:text-slate-100
                dark:hover:bg-slate-800
              "
            >
              Usuários ({onlineUsers.length})

              <span className="text-slate-400 dark:text-slate-500">
                {usuariosColapsados ? "▸" : "▾"}
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
        />

      )}

    </main>
  );
}