"use client";

import rooms from "@/data/salas.json";

type Props = {
  onRoomChange: (room: string) => void;
};

export default function Sidebar({
  onRoomChange
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

      {rooms.map((room) => (
        <div
          key={room.id}
          onClick={() =>
            onRoomChange(room.nome)
          }
          className="
            cursor-pointer
            border-b
            p-4
            hover:bg-slate-100
          "
        >
          {room.nome}
        </div>
      ))}
    </aside>
  );
}