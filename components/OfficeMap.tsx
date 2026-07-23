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
  // mundo pra saber quem existe no sistema, mesmo offline (vira só uma
  // marcação pequena no mapa, não a sala inteira).
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

// Marcação pequena pra quem está offline — mostra que a pessoa existe no
// sistema, mas sem abrir a sala inteira dela (só aparece de verdade
// quando ela conecta).
function OfflineUserMarker({
  nome,
  avatarTipo,
  avatarValor,
}: {
  nome: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
}) {

  const initials =
    nome
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      title={`${nome} · offline`}
      className="
        flex
        w-20
        flex-col
        items-center
        gap-1
        rounded-xl
        border
        border-dashed
        border-slate-700
        bg-slate-900/40
        px-2
        py-2
        opacity-60
      "
    >

      <div className="relative">

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            overflow-hidden
            rounded-full
            bg-slate-600
            text-xs
            font-bold
            text-white
            grayscale
          "
        >

          {avatarTipo === "foto" &&
          avatarValor ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarValor}
              alt={nome}
              className="h-full w-full object-cover"
            />
          ) : avatarTipo === "emoji" &&
            avatarValor ? (
            <span className="text-sm">
              {avatarValor}
            </span>
          ) : (
            initials
          )}

        </div>

        <span
          className="
            absolute
            -bottom-0.5
            -right-0.5
            h-2.5
            w-2.5
            rounded-full
            border-2
            border-slate-900
            bg-slate-500
          "
        />

      </div>

      <span
        className="
          max-w-full
          truncate
          text-center
          text-[10px]
          text-slate-400
        "
      >
        {nome}
      </span>

    </div>
  );
}

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
  // data/salas.json) — as salas pessoais são derivadas direto de `users`
  // logo abaixo, já que precisamos saber quem está online ou não pra
  // decidir entre mostrar a sala inteira ou só uma marcação pequena.
  const commonRooms = allRooms.slice(0, 3);

  const onlineOwners = users.filter(
    (user) => user.online !== false
  );

  const offlineOwners = users.filter(
    (user) => user.online === false
  );

  function personalRoomName(user: User) {
    return (
      user.salaNome ||
      `Espaço ${user.nome}`
    );
  }

  function roomUsers(roomName: string) {
    return users.filter(
      (user) =>
        user.room === roomName &&
        user.online !== false
    );
  }

  function renderRoom(roomName: string) {

    const usersInRoom = roomUsers(roomName);

    const seatClick = (seat: number) =>
      onSeatClick(roomName, seat);

    if (roomName === "Recepção") {
      return (
        <ReceptionRoom
          users={usersInRoom}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          onSeatClick={seatClick}
        />
      );
    }

    if (roomName === "Sala de Reunião") {
      return (
        <MeetingRoom
          users={usersInRoom}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          onSeatClick={seatClick}
        />
      );
    }

    if (roomName === "Espaço Natureza") {
      return (
        <NatureRoom
          users={usersInRoom}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          onSeatClick={seatClick}
        />
      );
    }

    // Dono da sala pessoal (mesmo critério do buildRoomList: nome
    // customizado ou "Espaço {nome}") — usado pra mostrar o avatar dele no
    // lugar de um ícone genérico, mesmo que ele esteja offline agora.
    const owner = users.find(
      (candidate) =>
        (candidate.salaNome ||
          `Espaço ${candidate.nome}`) ===
        roomName
    );

    return (
      <UserOfficeRoom
        room={roomName}
        users={usersInRoom}
        currentUserId={currentUserId}
        ownerNome={owner?.nome ?? roomName}
        ownerAvatarTipo={owner?.avatarTipo}
        ownerAvatarValor={owner?.avatarValor}
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
        border-slate-700
        bg-gradient-to-b
        from-slate-900
        to-slate-950
        p-5
        shadow-inner
      "
    >

      <div
        className="
          grid
          gap-3

          lg:grid-cols-[1fr_1.3fr_1fr]
        "
      >

        <div className="min-w-[260px]">
          {renderRoom(commonRooms[0].nome)}
        </div>

        <div className="min-w-[260px]">
          {renderRoom(commonRooms[1].nome)}
        </div>

        <div className="min-w-[260px]">
          {renderRoom(commonRooms[2].nome)}
        </div>

      </div>

      <div
        className="mt-3 grid gap-3"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >

        {onlineOwners.map((owner) => (

          <div key={owner.id}>
            {renderRoom(
              personalRoomName(owner)
            )}
          </div>

        ))}

      </div>

      {offlineOwners.length > 0 && (

        <div className="mt-3">

          <p
            className="
              mb-2
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            Offline
          </p>

          <div className="flex flex-wrap gap-2">

            {offlineOwners.map((owner) => (

              <OfflineUserMarker
                key={owner.id}
                nome={owner.nome}
                avatarTipo={
                  owner.avatarTipo
                }
                avatarValor={
                  owner.avatarValor
                }
              />

            ))}

          </div>

        </div>

      )}

    </div>
  );
}
