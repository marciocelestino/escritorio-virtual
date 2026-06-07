type User = {
  id: number;
  nome: string;
  room: string;
};

type Props = {
  room: string;
  users: User[];
};

export default function RoomPresence({
  room,
  users,
}: Props) {

  const usersInRoom =
    users.filter(
      (user) => user.room === room
    );

  return (
    <div
      className="
        rounded-2xl
        border
        bg-white
        p-5
        shadow-sm
      "
    >
      <h4
        className="
          mb-3
          font-semibold
        "
      >
        Pessoas nesta sala
      </h4>

      {usersInRoom.length === 0 && (
        <p
          className="
            text-sm
            text-slate-500
          "
        >
          Nenhum usuário presente.
        </p>
      )}

      {usersInRoom.map((user) => (
        <div
          key={user.id}
          className="
            py-1
          "
        >
          👤 {user.nome}
        </div>
      ))}
    </div>
  );
}