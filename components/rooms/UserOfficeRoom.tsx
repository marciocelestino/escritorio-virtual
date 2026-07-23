import PositionedAvatar from "../PositionedAvatar";
import { EmptySeatMarker } from "./RoomDecor";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
  seat?: number | null;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

type Props = {
  room: string;
  users: User[];
  currentUserId: number;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
  onSeatClick: (seat: number) => void;
};

export default function UserOfficeRoom({
  room,
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const columns = [20, 120, 220];

  const positions = [
    ...columns.map((x) => ({ x, y: 46 })),
    ...columns.map((x) => ({ x, y: 118 })),
  ];

  return (
    <div
      className="
        relative
        h-[210px]
        rounded-2xl
        border
        bg-white
        p-4
        dark:border-slate-700
        dark:bg-slate-800
      "
    >

      <h3
        className="
          mb-2
          text-sm
          font-semibold
          text-slate-900
          dark:text-slate-100
        "
      >
        💻 {room}
      </h3>

      {positions.map((pos, seatIndex) => {

        const occupant = users.find(
          (user) => user.seat === seatIndex
        );

        if (occupant) {
          return (
            <PositionedAvatar
              key={seatIndex}
              nome={occupant.nome}
              status={occupant.status}
              isCurrentUser={
                occupant.id === currentUserId
              }
              avatarTipo={occupant.avatarTipo}
              avatarValor={occupant.avatarValor}
              x={pos.x}
              y={pos.y}
              onClick={() =>
                onUserClick(
                  occupant.id,
                  occupant.nome
                )
              }
            />
          );
        }

        return (
          <EmptySeatMarker
            key={seatIndex}
            x={pos.x}
            y={pos.y}
            onClick={() =>
              onSeatClick(seatIndex)
            }
          />
        );
      })}

    </div>
  );
}
