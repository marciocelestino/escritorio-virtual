"use client";

import rooms from "@/data/salas.json";

type Props = {
  currentRoom: string;
  onRoomChange: (room: string) => void;
};

export default function Sidebar({
  currentRoom,
  onRoomChange,
}: Props) {
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
        "
      >
        Salas
      </h2>

      {rooms.map((room) => {
        const active =
          room.nome === currentRoom;

        return (
          <div
            key={room.id}
            onClick={() =>
              onRoomChange(room.nome)
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
            {active && "📍 "}
            {room.nome}
          </div>
        );
      })}
    </aside>
  );
}