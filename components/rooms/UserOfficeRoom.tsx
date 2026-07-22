import PositionedAvatar from "../PositionedAvatar";

type User = {
  id: number;
  nome: string;
  room: string;
  status?: string;
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
};

export default function UserOfficeRoom({
  room,
  users,
  currentUserId,
  onUserClick,
}: Props) {

  const positions = [
    { x: 140, y: 120 },
    { x: 320, y: 120 },
    { x: 500, y: 120 },
    { x: 140, y: 260 },
    { x: 320, y: 260 },
    { x: 500, y: 260 },
  ];

  return (
    <div
      className="
        relative
        h-[420px]
        rounded-2xl
        border
        bg-white
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
        💻 {room}
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-[110px]
          -translate-x-1/2
          text-6xl
        "
      >
        🖥️ 🖥️
      </div>

      <div
        className="
          absolute
          left-1/2
          top-[220px]
          -translate-x-1/2
          text-6xl
        "
      >
        💺
      </div>

      {users.map((user, index) => {

        const pos =
          positions[index] ||
          { x: 50, y: 50 };

        return (
          <PositionedAvatar
          key={user.id}
          nome={user.nome}
          status={user.status}
          isCurrentUser={
            user.id === currentUserId
          }
          avatarTipo={user.avatarTipo}
          avatarValor={user.avatarValor}
          x={pos.x}
          y={pos.y}
          onClick={() =>
            onUserClick(user.id, user.nome)
          }
        />
        );

      })}

    </div>
  );
}