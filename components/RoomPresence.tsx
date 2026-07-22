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
          flex
          items-center
          justify-between
          font-semibold
        "
      >
        Nesta Sala

        <span
          className="
            rounded-full
            bg-slate-100
            px-2
            py-0.5
            text-xs
            font-medium
            text-slate-500
          "
        >
          {usersInRoom.length}
        </span>
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

      <div
        className="
          flex
          max-h-40
          flex-wrap
          gap-2
          overflow-y-auto
          pr-1
        "
      >

        {usersInRoom.map((user) => (
          <span
            key={user.id}
            className="
              max-w-full
              truncate
              rounded-full
              bg-slate-100
              px-3
              py-1
              text-sm
              text-slate-700
            "
            title={user.nome}
          >
            👤 {user.nome}
          </span>
        ))}

      </div>
    </div>
  );
}