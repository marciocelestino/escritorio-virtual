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

export default function NatureRoom({
  users,
  currentUserId,
  onUserClick,
}: Props) {

  const positions = [
    { x: 140, y: 130 },
    { x: 520, y: 130 },
    { x: 250, y: 280 },
    { x: 430, y: 280 },
  ];

  return (
    <div
      className="
        relative
        h-[420px]
        rounded-2xl
        border
        bg-green-50
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
        🌳 Espaço Natureza
      </h3>

      <div
        className="
          absolute
          left-[100px]
          top-[80px]
          text-5xl
        "
      >
        🌳
      </div>

      <div
        className="
          absolute
          left-[320px]
          top-[50px]
          text-5xl
        "
      >
        🌳
      </div>

      <div
        className="
          right-[100px]
          absolute
          top-[80px]
          text-5xl
        "
      >
        🌳
      </div>

      <div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          border-4
          border-blue-300
          bg-blue-200
          px-14
          py-8
          text-xl
        "
      >
        🦆 Lago
      </div>

      <div
        className="
          absolute
          left-[180px]
          bottom-[70px]
          text-5xl
        "
      >
        🌿
      </div>

      <div
        className="
          absolute
          left-[350px]
          bottom-[70px]
          text-5xl
        "
      >
        🌿
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