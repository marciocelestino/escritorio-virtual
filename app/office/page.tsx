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
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser, getSessionToken } from "@/lib/session";
import RoomView from "@/components/RoomView";
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

  const [mounted, setMounted] =
    useState(false);

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

  setMounted(true);

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
  onNotify={showNotification}
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
                virar um webapp instalável (PWA),
                chat de texto,
                gravação de reuniões
                e modo escuro.
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
          className="
            w-80
            overflow-y-auto
            border-l
            bg-white
          "
        >

          <button
            onClick={() =>
              setUsuariosColapsados(
                (prev) => !prev
              )
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
              {usuariosColapsados
                ? "▸"
                : "▾"}
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

        </aside>

      </div>

    </main>
  );
}