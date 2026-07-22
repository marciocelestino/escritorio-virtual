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
  users: User[];
  currentUserId: number;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
  onSeatClick: (seat: number) => void;
};

export default function MeetingRoom({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const positions = [
    { x: 100, y: 80 },
    { x: 260, y: 80 },
    { x: 420, y: 80 },

    { x: 100, y: 250 },
    { x: 260, y: 250 },
    { x: 420, y: 250 },
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
      "
    >

      <h3
        className="
          mb-6
          text-2xl
          font-bold
        "
      >
        👥 Sala de Reunião
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-1/2
          flex
          h-36
          w-[420px]
          -translate-x-1/2
          -translate-y-1/2
          items-center
          justify-center
          rounded-xl
          border
          border-amber-800/20
          bg-gradient-to-b
          from-amber-100
          to-amber-200
          text-xl
          font-bold
          text-amber-900
          shadow-sm
        "
      >
        Mesa de Reunião
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