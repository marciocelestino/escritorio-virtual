import ReceptionRoom from "./rooms/ReceptionRoom";
import MeetingRoom from "./rooms/MeetingRoom";
import NatureRoom from "./rooms/NatureRoom";
import UserOfficeRoom from "./rooms/UserOfficeRoom";

type User = {
  id: number;
  nome: string;
  room: string;
  status: string;
};

type Props = {
  room: string;
  users: User[];
  onUserClick: (
    userName: string
  ) => void;
};
export default function RoomView({
  room,
  users,
  onUserClick,
}: Props) {

  const roomUsers =
    users.filter(
      (user) => user.room === room
    );

  if (room === "Recepção") {
    return (
      <ReceptionRoom
        users={roomUsers}
        currentUserId={1}
        onUserClick={onUserClick}
      />
    );
  }

  if (room === "Sala de Reunião") {
    return (
      <MeetingRoom
        users={roomUsers}
        currentUserId={1}
        onUserClick={onUserClick}
      />
          );
  }

  if (room === "Espaço Natureza") {
    return (
      <NatureRoom
        users={roomUsers}
        currentUserId={1}
        onUserClick={onUserClick}
      />
          );
  }

  return (
      <UserOfficeRoom
        room={room}
        users={roomUsers}
        currentUserId={1}
        onUserClick={onUserClick}
      />
  );
}