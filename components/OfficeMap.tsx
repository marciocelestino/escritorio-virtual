import { buildRoomList } from "@/lib/rooms";
import ReceptionRoom from "./rooms/ReceptionRoom";
import MeetingRoom from "./rooms/MeetingRoom";
import NatureRoom from "./rooms/NatureRoom";
import UserOfficeRoom from "./rooms/UserOfficeRoom";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
  online?: boolean;
  portasAbertas?: boolean;
  seat?: number | null;
  salaNome?: string | null;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

type Props = {
  // Elenco completo (não só quem está online agora) — precisa de todo
  // mundo pra saber o nome de cada sala pessoal, mesmo a de quem está
  // offline no momento (a sala continua existindo no mapa, só vazia).
  users: User[];
  currentUserId: number;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
  onSeatClick: (
    room: string,
    seat: number
  ) => void;
};

// Mapa do escritório inteiro — todas as salas visíveis ao mesmo tempo
// (em vez de escolher uma sala por vez), inspirado num mockup enviado
// pelo cliente. Reaproveita os mesmos componentes de sala de sempre
// (assento clicável, decoração, avatares reais) só que todos juntos
// numa única visão, sobre um "piso" escuro que imita um corredor.
export default function OfficeMap({
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const allRooms = buildRoomList(users);

  // buildRoomList sempre devolve as 3 salas comuns primeiro (vindas de
  // data/salas.json), depois uma sala pessoal por usuário.
  const commonRooms = allRooms.slice(0, 3);
  const personalRooms = allRooms.slice(3);

  function roomUsers(roomName: string) {
    return users.filter(
      (user) =>
        user.room === roomName &&
        user.online !== false
    );
  }

  function renderRoom(roomName: string) {

    const users = roomUsers(roomName);

    const seatClick = (seat: number) =>
      onSeatClick(roomName, seat);

    if (roomName === "Recepção") {
      return (
        <ReceptionRoom
          users={users}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          onSeatClick={seatClick}
        />
      );
    }

    if (roomName === "Sala de Reunião") {
      return (
        <MeetingRoom
          users={users}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          onSeatClick={seatClick}
        />
      );
    }

    if (roomName === "Espaço Natureza") {
      return (
        <NatureRoom
          users={users}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          onSeatClick={seatClick}
        />
      );
    }

    return (
      <UserOfficeRoom
        room={roomName}
        users={users}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
        onSeatClick={seatClick}
      />
    );
  }

  return (
    <div
      className="
        rounded-3xl
        border
        border-stone-700
        bg-gradient-to-b
        from-stone-800
        to-stone-900
        p-6
        shadow-inner
      "
    >

      <div
        className="
          grid
          gap-6

          lg:grid-cols-[1fr_1.6fr_1fr]
        "
      >

        <div className="min-w-[320px]">
          {renderRoom(commonRooms[0].nome)}
        </div>

        <div className="min-w-[600px]">
          {renderRoom(commonRooms[1].nome)}
        </div>

        <div className="min-w-[320px]">
          {renderRoom(commonRooms[2].nome)}
        </div>

      </div>

      <div
        className="mt-6 grid gap-6"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >

        {personalRooms.map((room) => (

          <div key={room.id}>
            {renderRoom(room.nome)}
          </div>

        ))}

      </div>

    </div>
  );
}
