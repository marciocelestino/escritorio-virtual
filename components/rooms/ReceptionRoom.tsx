import PositionedAvatar from "../PositionedAvatar";
import {
  DoorDecor,
  SofaDecor,
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
  users: User[];
  currentUserId: number;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
  onSeatClick: (seat: number) => void;
};

export default function ReceptionRoom({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const positions = [
    { x: 140, y: 240 },
    { x: 520, y: 240 },
    { x: 330, y: 320 },
    { x: 230, y: 120 },
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
        🏢 Recepção
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-[70px]
          -translate-x-1/2
        "
      >
        <DoorDecor />
      </div>

      <div
        className="
          absolute
          left-[130px]
          top-[175px]
        "
      >
        <SofaDecor />
      </div>

      <div
        className="
          absolute
          right-[130px]
          top-[175px]
        "
      >
        <SofaDecor />
      </div>

      <div
        className="
          absolute
          left-1/2
          bottom-[70px]
          -translate-x-1/2
          rounded-lg
          border
          bg-slate-100
          px-8
          py-3
          font-semibold
        "
      >
        Balcão de Recepção
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