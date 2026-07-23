import PositionedAvatar from "../PositionedAvatar";
import {
  EmptySeatMarker,
  RoomBadge,
  ROOM_BADGE_COLORS,
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

  // 2 fileiras de 5 lugares (10 ao todo), mesma altura da Sala de Reunião.
  const columns = [20, 120, 220, 320, 420];

  const positions = [
    ...columns.map((x) => ({ x, y: 46 })),
    ...columns.map((x) => ({ x, y: 160 })),
  ];

  return (
    <div
      className="
        relative
        h-[280px]
        overflow-x-auto
        rounded-2xl
        border
        bg-green-50
        p-4
        dark:border-white/10
        dark:bg-slate-900
      "
    >
      <h3
        className="
          mb-2
          flex
          items-center
          gap-2
          text-sm
          font-semibold
          text-slate-900
          dark:text-slate-100
        "
      >
        <RoomBadge
          icon="🌳"
          colorClass={
            ROOM_BADGE_COLORS.natureza
          }
        />
        Espaço Natureza
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
