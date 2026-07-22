"use client";

import { buildRoomList } from "@/lib/rooms";

type PulseUser = {
  id: number;
  nome: string;
  room: string;
  online?: boolean;
  salaNome?: string | null;
};

type Props = {
  currentRoom: string;
  users: PulseUser[];
  onSelect: (room: string) => void;
};

export default function RoomPulse({
  currentRoom,
  users,
  onSelect,
}: Props) {

  const rooms = buildRoomList(users);

  function getCount(roomName: string) {
    return users.filter(
      (user) =>
        user.online !== false &&
        user.room === roomName
    ).length;
  }

  return (
    <div
      className="
        mb-6
        flex
        flex-wrap
        gap-2
      "
    >
      {rooms.map((room) => {

        const count = getCount(room.nome);
        const isCurrent = room.nome === currentRoom;

        return (
          <button
            key={room.id}
            onClick={() => onSelect(room.nome)}
            className={`
              flex
              items-center
              gap-2
              rounded-full
              border
              px-3
              py-1.5
              text-xs
              font-medium

              ${
                isCurrent
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : count > 0
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
              }
            `}
          >
            <span
              className={`
                h-2
                w-2
                rounded-full

                ${
                  isCurrent
                    ? "bg-blue-600"
                    : count > 0
                    ? "bg-green-500"
                    : "bg-slate-300"
                }
              `}
            />

            {room.nome}

            <span
              className={`
                rounded-full
                px-1.5
                text-[10px]
                font-semibold

                ${
                  isCurrent
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }
              `}
            >
              {count}
            </span>
          </button>
        );

      })}
    </div>
  );
}
