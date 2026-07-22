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
  users: User[];
  currentUserId: number;
  onUserClick: (
    userId: number,
    userName: string
  ) => void;
};

export default function MeetingRoom({
  users,
  currentUserId,
  onUserClick,
}: Props) {

  const positions = [
    { x: 100, y: 80 },
    { x: 260, y: 80 },
    { x: 420, y: 80 },

    { x: 100, y: 250 },
    { x: 260, y: 250 },
    { x: 420, y: 250 },
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
        👥 Sala de Reunião
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-1/2
          flex
          h-36
          w-[420px]
          -translate-x-1/2
          -translate-y-1/2
          items-center
          justify-center
          rounded-xl
          border
          bg-slate-100
          text-xl
          font-bold
        "
      >
        Mesa de Reunião
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