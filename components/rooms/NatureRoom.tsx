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

export default function NatureRoom({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const positions = [
    { x: 20, y: 46 },
    { x: 120, y: 46 },
    { x: 220, y: 46 },
    { x: 320, y: 46 },
  ];

  return (
    <div
      className="
        relative
        h-[140px]
        rounded-2xl
        border
        bg-green-50
        p-4
        dark:border-slate-700
        dark:bg-emerald-950/40
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
        🌳 Espaço Natureza
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
