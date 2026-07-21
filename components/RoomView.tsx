import ReceptionRoom from "./rooms/ReceptionRoom";
import MeetingRoom from "./rooms/MeetingRoom";
import NatureRoom from "./rooms/NatureRoom";
import UserOfficeRoom from "./rooms/UserOfficeRoom";
import VideoMeeting from "./VideoMeeting";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
};

type Props = {
  room: string;
  users: User[];
  currentUserId: number;
  onUserClick: (
    userName: string
  ) => void;
};
export default function RoomView({
  room,
  users,
  currentUserId,
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
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />
    );
  }

if (room === "Sala de Reunião") {
  return (
    <>
      <MeetingRoom
        users={roomUsers}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />

      <VideoMeeting />
    </>
  );
}

  if (room === "Espaço Natureza") {
    return (
      <NatureRoom
        users={roomUsers}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />
          );
  }

  return (
      <UserOfficeRoom
        room={room}
        users={roomUsers}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />
  );
}