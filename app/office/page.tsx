"use client";
import { getSocket }
from "@/lib/socket";
import Notification from "@/components/Notification";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserCard from "@/components/UserCard";
import RoomPresence from "@/components/RoomPresence";
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser, getSessionToken } from "@/lib/session";
import RoomView from "@/components/RoomView";

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
};

type LivePresence = {
  room: string;
  status?:
    | "Disponivel"
    | "Ausente"
    | "Reuniao";
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

  const [notification, setNotification] =
  useState("");

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

socket.emit(
  "user-connected",
  {
    id: user.id,
    nome: user.nome,
    room: currentRoom,
    status: initialStatus,
    token: getSessionToken(),
  }
);

socket.on(
  "connect",
  () => {
    console.log(
      "Socket conectado:",
      socket.id
    );
  }
);

socket.on(
  "presence-update",
  (users: Array<{
    id: number;
    room: string;
    status?: LivePresence["status"];
  }>) => {

    const map: Record<
      number,
      LivePresence
    > = {};

    users.forEach((liveUser) => {
      map[liveUser.id] = {
        room: liveUser.room,
        status: liveUser.status,
      };
    });

    setLiveUsers(map);

  }
);

setCurrentUserId(
  user.id
);

  setStatus(initialStatus);

  // Conecta o socket uma única vez, no valor de currentRoom no momento da
  // montagem — incluir currentRoom nas deps re-registraria os listeners do
  // socket a cada troca de sala, duplicando-os.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [router]);

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
  onUserClick={(name) =>
    showNotification(
      `Você chamou ${name}`
    )
  }
/>
            </div>

          </div>

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-2
              2xl:grid-cols-4
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
                Área da Sala
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-600
                "
              >
                Em breve teremos
                áudio,
                webcam,
                compartilhamento de tela
                e movimentação em tempo real.
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
                Próxima Etapa
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-600
                "
              >
                Cutucar usuários,
                presença online,
                áudio,
                webcam e
                compartilhamento de tela.
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

          <div
            className="
              border-b
              p-4
            "
          >

            <h2
              className="
                font-bold
                text-slate-900
              "
            >
              Usuários
            </h2>

          </div>

          {onlineUsers.map((user) => (

            <UserCard
              key={user.id}
              nome={user.nome}
              status={user.status}
            />

          ))}

        </aside>

      </div>

    </main>
  );
}