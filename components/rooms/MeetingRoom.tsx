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

// 15 lugares (3 fileiras de 5), formato "sala de treinamento".
const SEAT_COUNT = 15;

export default function MeetingRoom({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  return (
    <div
      className="
        rounded-2xl
        border
        bg-white
        p-4
        dark:border-white/10
        dark:bg-slate-900
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
          text-slate-900
          dark:text-slate-100
        "
      >
        <RoomBadge
          icon="👥"
          colorClass={
            ROOM_BADGE_COLORS.reuniao
          }
        />
        Sala de Reunião
      </h3>

      <div
        className="
          grid
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
                onClick={() =>
                  onSeatClick(seatIndex)
                }
              />
            );

          }
        )}

      </div>

    </div>
  );
}
