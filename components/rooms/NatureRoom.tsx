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

// 10 lugares (2 fileiras de 5), mesma altura da Sala de Reunião.
const SEAT_COUNT = 10;

// Fundo verde escuro sempre (não depende do tema claro/escuro do resto
// do app) — combina com a ideia de "espaço natureza" e destaca essa sala
// das outras no mapa.
export default function NatureRoom({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  return (
    <div
      className="
        flex
        h-full
        flex-col
        rounded-2xl
        border
        border-emerald-800/40
        bg-gradient-to-br
        from-emerald-950
        via-green-950
        to-emerald-900
        p-4
        shadow-inner
      "
    >
      <h3
        className="
          mb-3
          flex
          items-center
          gap-2
          text-[10px]
          font-semibold
          text-emerald-50
        "
      >
        <span
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-emerald-400/20
            text-sm
            text-emerald-200
          "
        >
          🌳
        </span>
        Espaço Natureza
      </h3>

      <div className="flex flex-1 items-center">
      <div
        className="
          grid
          w-full
          grid-cols-5
          gap-x-2
          gap-y-4
        "
      >

        {Array.from(
          { length: SEAT_COUNT },
          (_, seatIndex) => {

            const occupant = users.find(
              (user) =>
                user.seat === seatIndex
            );

            if (occupant) {
              return (
                <PositionedAvatar
                  key={seatIndex}
                  nome={occupant.nome}
                  status={occupant.status}
                  isCurrentUser={
                    occupant.id ===
                    currentUserId
                  }
                  avatarTipo={
                    occupant.avatarTipo
                  }
                  avatarValor={
                    occupant.avatarValor
                  }
                  variant="nature"
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
                variant="nature"
                onClick={() =>
                  onSeatClick(seatIndex)
                }
              />
            );

          }
        )}

      </div>
      </div>

    </div>
  );
}
