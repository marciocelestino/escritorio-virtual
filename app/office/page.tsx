"use client";
import Notification from "@/components/Notification";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserCard from "@/components/UserCard";
import RoomPresence from "@/components/RoomPresence";
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser } from "@/lib/session";
import RoomView from "@/components/RoomView";

import usersData from "@/data/usuarios.json";

type UserItem = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  status: "Disponivel" | "Ausente" | "Reuniao";
  online?: boolean;
  room: string;
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

  setAllUsers((prev) =>
    prev.map((user) => {

      if (
        user.id === currentUserId
      ) {
        return {
          ...user,
          room,
        };
      }

      return user;
    })
  );
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

 const [allUsers, setAllUsers] =
  useState<UserItem[]>(
    usersData as UserItem[]
  );
  const onlineUsers = useMemo(() => {
  return allUsers.filter(
    (user) => user.online !== false
  );
}, [allUsers]);

  useEffect(() => {

  setMounted(true);

  const user =
    getSessionUser();

  if (!user) {
    router.push("/");
    return;
  }

  setCurrentUserId(user.id);

  const savedStatus =
    localStorage.getItem("status");

  if (
    savedStatus === "Disponivel" ||
    savedStatus === "Ausente" ||
    savedStatus === "Reuniao"
  ) {
    setStatus(savedStatus);
  }

}, [router]);

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "status",
      status
    );

  }, [status, mounted]);

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