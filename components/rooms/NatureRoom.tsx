import PositionedAvatar from "../PositionedAvatar";
import {
  TreeDecor,
  GrassDecor,
  PondDecor,
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

export default function NatureRoom({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const positions = [
    { x: 140, y: 130 },
    { x: 520, y: 130 },
    { x: 250, y: 280 },
    { x: 430, y: 280 },
  ];

  return (
    <div
      className="
        relative
        h-[420px]
        rounded-2xl
        border
        bg-green-50
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
        🌳 Espaço Natureza
      </h3>

      <div
        className="
          absolute
          left-[100px]
          top-[70px]
        "
      >
        <TreeDecor />
      </div>

      <div
        className="
          absolute
          left-[320px]
          top-[40px]
        "
      >
        <TreeDecor />
      </div>

      <div
        className="
          right-[100px]
          absolute
          top-[70px]
        "
      >
        <TreeDecor />
      </div>

      <div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
        "
      >
        <PondDecor />
      </div>

      <div
        className="
          absolute
          left-[180px]
          bottom-[70px]
        "
      >
        <GrassDecor />
      </div>

      <div
        className="
          absolute
          left-[350px]
          bottom-[70px]
        "
      >
        <GrassDecor />
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