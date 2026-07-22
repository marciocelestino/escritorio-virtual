"use client";
import { getSocket }
from "@/lib/socket";
import Notification from "@/components/Notification";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserCard from "@/components/UserCard";
import RoomPresence from "@/components/RoomPresence";
import RoomPulse from "@/components/RoomPulse";
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser, getSessionToken } from "@/lib/session";
import { useMounted } from "@/lib/useMounted";
import RoomView from "@/components/RoomView";
import VideoMeeting from "@/components/VideoMeeting";
import { roomSupportsCall } from "@/lib/rooms";
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

  const getRoomType = () => {

    switch (currentRoom) {

      case "Sala de Reunião":
        return "Reunião";

      case "Espaço Natureza":
        return "Convivência";

      default:
        return "Escritório";
    }
  };

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

    <main className="flex h-screen flex-col bg-slate-100">
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
            z-50
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

          <RoomPulse
            currentRoom={currentRoom}
            users={allUsers}
            onSelect={moveToRoom}
          />

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
                "
              >
                Sala Atual
              </h2>

              <p
                className="
                  mt-2
                  text-xl
                  text-slate-600
                "
              >
                {currentRoom}
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
                      ? "border-green-300 bg-green-100 text-green-800"
                      : "border-slate-300 bg-slate-100 text-slate-600"
                  }
                `}
              >
                {portasAbertas
                  ? "🚪 Portas abertas"
                  : "🚪 Portas fechadas"}
              </button>

            </div>

          </div>

          <div
            className="
              mb-8
              rounded-2xl
              border
              bg-white
              p-6
              shadow-sm
            "
          >

            <h3
              className="
                text-3xl
                font-semibold
                text-slate-900
              "
            >
              {currentRoom}
            </h3>

            {currentRoom ===
              "Espaço Natureza" && (

              <div
                className="
                  mt-4
                  rounded-lg
                  border
                  border-green-200
                  bg-green-50
                  p-4
                "
              >

                🌳 Árvores
                <br />

                🌿 Área de descanso
                <br />

                🦆 Pequeno lago
                <br />

                ☕ Conversas informais

              </div>

            )}

            <div
              className="
                mt-4
                space-y-2
                text-slate-600
              "
            >

              <p>
                👥 Usuários presentes:
                {" "}
                {
                  onlineUsers.filter(
                    (user) =>
                      user.room === currentRoom
                  ).length
                }
              </p>

              <p>
                🏢 Tipo:
                {" "}
                {getRoomType()}
              </p>

              <p>
                🟢 Status:
                Aberta
              </p>
<RoomView
  room={currentRoom}
  users={onlineUsers}
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
  onSeatClick={chooseSeat}
/>
            </div>

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
              "
            >

              <h4
                className="
                  font-semibold
                  text-slate-900
                "
              >
                Evolução Futura
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-600
                "
              >
                Ideias para as próximas fases:
                responsividade para celular,
                webapp instalável (PWA),
                chat de texto,
                modo escuro,
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
              "
            >

              <h4
                className="
                  font-semibold
                  text-slate-900
                "
              >
                Usuários Online
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-600
                "
              >
                {onlineUsers.length}
                {" "}
                usuários ativos.
              </p>

            </div>

            <RoomPresence
              room={currentRoom}
              users={onlineUsers}
            />

          </div>

        </section>

        <aside
          className={`
            overflow-y-auto
            border-l
            bg-white

            ${
              usuariosColapsados
                ? "w-16"
                : "w-80"
            }
          `}
        >

          {usuariosColapsados ? (

            <div
              className="
                flex
                flex-col
                items-center
                gap-2
                py-4
              "
            >

              <button
                onClick={() =>
                  setUsuariosColapsados(false)
                }
                title="Mostrar usuários"
                className="
                  mb-2
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                "
              >
                ‹
              </button>

              {onlineUsers.map((user) => {

                const statusColor =
                  user.status === "Disponivel"
                    ? "bg-green-500"
                    : user.status === "Ausente"
                    ? "bg-yellow-400"
                    : user.status === "Reuniao"
                    ? "bg-red-500"
                    : "bg-slate-300";

                return (
                  <button
                    key={user.id}
                    onClick={() =>
                      setUsuariosColapsados(false)
                    }
                    title={`${user.nome} · ${user.status ?? "Disponível"}${
                      user.room !== currentRoom
                        ? ` · ${user.room}`
                        : ""
                    }`}
                    className="
                      relative
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-100
                      text-xs
                      font-semibold
                      text-slate-600
                      hover:bg-slate-200
                    "
                  >
                    {user.nome
                      .charAt(0)
                      .toUpperCase()}

                    <span
                      className={`
                        absolute
                        -bottom-0.5
                        -right-0.5
                        h-2.5
                        w-2.5
                        rounded-full
                        border
                        border-white
                        ${statusColor}
                      `}
                    />
                  </button>
                );

              })}

            </div>

          ) : (

            <button
              onClick={() =>
                setUsuariosColapsados(true)
              }
              className="
                flex
                w-full
                items-center
                justify-between
                border-b
                p-4
                font-bold
                text-slate-900
                hover:bg-slate-50
              "
            >
              Usuários

              <span className="text-slate-400">
                ▾
              </span>
            </button>

          )}

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