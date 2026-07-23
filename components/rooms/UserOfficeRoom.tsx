import PositionedAvatar from "../PositionedAvatar";
import {
  DesksDecor,
  ChairDecor,
  EmptySeatMarker,
} from "./RoomDecor";

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

  const positions = [
    { x: 140, y: 120 },
    { x: 320, y: 120 },
    { x: 500, y: 120 },
    { x: 140, y: 260 },
    { x: 320, y: 260 },
    { x: 500, y: 260 },
  ];

  return (
    <div
      className="
        relative
        h-[420px]
        rounded-2xl
        border
        bg-white
        p-6
        dark:border-slate-700
        dark:bg-slate-800
      "
    >

      <h3
        className="
          mb-6
          text-2xl
          font-bold
          text-slate-900
          dark:text-slate-100
        "
      >
        💻 {room}
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-[100px]
          -translate-x-1/2
        "
      >
        <DesksDecor />
      </div>

      <div
        className="
          absolute
          left-1/2
          top-[210px]
          -translate-x-1/2
        "
      >
        <ChairDecor />
      </div>

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