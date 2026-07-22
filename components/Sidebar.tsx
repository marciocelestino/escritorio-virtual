"use client";

import { useEffect, useState } from "react";
import { buildRoomList } from "@/lib/rooms";

type SidebarUser = {
  id: number;
  nome: string;
  room: string;
  online?: boolean;
  salaNome?: string | null;
};

type Props = {
  currentRoom: string;
  users: SidebarUser[];
  onRoomChange: (room: string) => void;
};

export default function Sidebar({
  currentRoom,
  users,
  onRoomChange,
}: Props) {

  const [collapsed, setCollapsed] =
    useState(() =>
      typeof window !== "undefined" &&
      localStorage.getItem(
        "salasColapsadas"
      ) === "true"
    );

  useEffect(() => {

    localStorage.setItem(
      "salasColapsadas",
      String(collapsed)
    );

  }, [collapsed]);

  const rooms = buildRoomList(users);

  function getIcon(
    roomName: string
  ) {

    if (roomName === "Recepção") {
      return "🏢";
    }

    if (
      roomName === "Sala de Reunião"
    ) {
      return "👥";
    }

    if (
      roomName === "Espaço Natureza"
    ) {
      return "🌳";
    }

    return "💻";
  }

  function getRoomCount(
    roomName: string
  ) {

    return users.filter(
      (user) =>
        user.online !== false &&
        user.room === roomName
    ).length;
  }

  if (collapsed) {

    return (
      <aside
        className="
          flex
          w-16
          flex-col
          items-center
          gap-1
          border-r
          bg-white
          py-4
        "
      >
        <button
          onClick={() =>
            setCollapsed(false)
          }
          title="Mostrar salas"
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
          ›
        </button>

        {rooms.map((room) => {

          const active =
            room.nome === currentRoom;

          const count =
            getRoomCount(
              room.nome
            );

          return (
            <button
              key={room.id}
              onClick={() =>
                onRoomChange(
                  room.nome
                )
              }
              title={`${room.nome} (${count})`}
              className={`
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-lg

                ${
                  active
                    ? "bg-blue-100"
                    : "hover:bg-slate-100"
                }
              `}
            >
              {getIcon(room.nome)}

              {count > 0 && (
                <span
                  className="
                    absolute
                    -bottom-1
                    -right-1
                    rounded-full
                    border
                    border-white
                    bg-slate-700
                    px-1
                    text-[9px]
                    font-semibold
                    text-white
                  "
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside
      className="
        w-80
        border-r
        bg-white
      "
    >
      <div
        className="
          flex
          w-full
          items-center
          justify-between
          border-b
          p-4
          font-bold
          text-slate-900
        "
      >
        <button
          onClick={() =>
            setCollapsed(true)
          }
          className="flex items-center gap-2 hover:opacity-70"
        >
          Salas
          <span className="text-slate-400 font-normal">
            ‹
          </span>
        </button>
      </div>

      {rooms.map((room) => {

        const active =
          room.nome === currentRoom;

        const count =
          getRoomCount(
            room.nome
          );

        return (

          <div
            key={room.id}
            onClick={() =>
              onRoomChange(
                room.nome
              )
            }
            className={`
              cursor-pointer
              border-b
              p-4
              transition

              ${
                active
                  ? "bg-blue-100 font-semibold text-blue-700"
                  : "hover:bg-slate-100"
              }
            `}
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <span>
                {getIcon(
                  room.nome
                )}{" "}
                {room.nome}
              </span>

              <span
                className="
                  rounded-full
                  bg-slate-200
                  px-2
                  py-1
                  text-xs
                "
              >
                {count}
              </span>

            </div>

          </div>

        );
      })}
    </aside>
  );
}
