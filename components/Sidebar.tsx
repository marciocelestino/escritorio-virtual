"use client";

import rooms from "@/data/salas.json";
import users from "@/data/usuarios.json";

type Props = {
  currentRoom: string;
  onRoomChange: (room: string) => void;
};

export default function Sidebar({
  currentRoom,
  onRoomChange,
}: Props) {

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
      <h2
        className="
          border-b
          p-4
          font-bold
          text-slate-900
        "
      >
        Salas
      </h2>

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