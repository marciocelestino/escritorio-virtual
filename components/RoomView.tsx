import ReceptionRoom from "./rooms/ReceptionRoom";
import MeetingRoom from "./rooms/MeetingRoom";
import NatureRoom from "./rooms/NatureRoom";
import UserOfficeRoom from "./rooms/UserOfficeRoom";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
  portasAbertas?: boolean;
  seat?: number | null;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

type Props = {
  room: string;
  users: User[];
  currentUserId: number;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
  onSeatClick: (seat: number) => void;
};
export default function RoomView({
  room,
  users,
  currentUserId,
  onUserClick,
  onSeatClick,
}: Props) {

  const roomUsers =
    users.filter(
      (user) => user.room === room
    );

  if (room === "Recepção") {
    return (
      <ReceptionRoom
        users={roomUsers}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
        onSeatClick={onSeatClick}
      />
    );
  }

  if (room === "Sala de Reunião") {
    return (
      <MeetingRoom
        users={roomUsers}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
        onSeatClick={onSeatClick}
      />
    );
  }

  if (room === "Espaço Natureza") {
    return (
      <NatureRoom
        users={roomUsers}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
        onSeatClick={onSeatClick}
      />
    );
  }

  return (
    <UserOfficeRoom
      room={room}
      users={roomUsers}
      currentUserId={currentUserId}
      onUserClick={onUserClick}
      onSeatClick={onSeatClick}
    />
  );
}