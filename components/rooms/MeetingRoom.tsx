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

  // 3 fileiras de 5 lugares (15 ao todo), voltadas pra mesa/tela no topo —
  // formato "sala de treinamento", em vez do antigo frente-a-frente (que
  // só cabia 6), pra caber um grupo bem maior.
  const columns = [80, 220, 360, 500, 640];

  const positions = [
    ...columns.map((x) => ({ x, y: 130 })),
    ...columns.map((x) => ({ x, y: 250 })),
    ...columns.map((x) => ({ x, y: 370 })),
  ];

  return (
    <div
      className="
        relative
        h-[480px]
        overflow-x-auto
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
        👥 Sala de Reunião
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-[65px]
          flex
          h-14
          w-[620px]
          -translate-x-1/2
          items-center
          justify-center
          rounded-xl
          border
          border-amber-800/20
          bg-gradient-to-b
          from-amber-100
          to-amber-200
          text-lg
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