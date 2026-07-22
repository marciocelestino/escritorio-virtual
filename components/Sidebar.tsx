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

  return (
    <aside
      className="
        w-80
        border-r
        bg-white
      "
    >
      <button
        onClick={() =>
          setCollapsed((prev) => !prev)
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
        Salas

        <span className="text-slate-400">
          {collapsed ? "▸" : "▾"}
        </span>
      </button>

      {!collapsed &&
        rooms.map((room) => {

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
