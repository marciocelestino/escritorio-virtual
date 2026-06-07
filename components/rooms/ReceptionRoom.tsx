import PositionedAvatar from "../PositionedAvatar";

type User = {
  id: number;
  nome: string;
  room: string;
  status: string;
};

type Props = {
  users: User[];
  currentUserId: number;
  onUserClick: (
    userName: string
  ) => void;
};

export default function ReceptionRoom({
  users,
  currentUserId,
  onUserClick,
}: Props) {

  const positions = [
    { x: 140, y: 240 },
    { x: 520, y: 240 },
    { x: 330, y: 320 },
    { x: 230, y: 120 },
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
        🏢 Recepção
      </h3>

      <div
        className="
          absolute
          left-1/2
          top-[90px]
          -translate-x-1/2
          text-6xl
        "
      >
        🚪
      </div>

      <div
        className="
          absolute
          left-[150px]
          top-[180px]
          text-5xl
        "
      >
        🛋️
      </div>

      <div
        className="
          absolute
          right-[150px]
          top-[180px]
          text-5xl
        "
      >
        🛋️
      </div>

      <div
        className="
          absolute
          left-1/2
          bottom-[70px]
          -translate-x-1/2
          rounded-lg
          border
          bg-slate-100
          px-8
          py-3
          font-semibold
        "
      >
        Balcão de Recepção
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
  x={pos.x}
  y={pos.y}
  onClick={() =>
    onUserClick(user.nome)
  }
/>
        );
      })}
    </div>
  );
}