import PositionedAvatar from "../PositionedAvatar";
import {
  EmptySeatMarker,
  OwnerAvatarBadge,
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
  ownerNome: string;
  ownerAvatarTipo?: string | null;
  ownerAvatarValor?: string | null;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
  onSeatClick: (seat: number) => void;
};

// 6 lugares (2 fileiras de 3).
const SEAT_COUNT = 6;

export default function UserOfficeRoom({
  room,
  users,
  currentUserId,
  ownerNome,
  ownerAvatarTipo,
  ownerAvatarValor,
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
        <OwnerAvatarBadge
          nome={ownerNome}
          avatarTipo={ownerAvatarTipo}
          avatarValor={ownerAvatarValor}
        />
        {room}
      </h3>

      <div className="flex flex-1 items-center">
      <div
        className="
          grid
          w-full
          grid-cols-3
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

    </div>
  );
}
