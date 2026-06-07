type Props = {
  nome: string;
  status: string;
  isCurrentUser?: boolean;
};

export default function UserAvatar({
  nome,
  status,
  isCurrentUser = false,
}: Props) {

  const initials =
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const statusColor = {
    Disponivel: "bg-green-500",
    Ausente: "bg-yellow-500",
    Reuniao: "bg-red-500",
  }[status] || "bg-slate-500";

  return (
    <div className="flex flex-col items-center">

      <div className="relative">

        <div
          className={`
            w-12
            h-12
            rounded-full
            flex
            items-center
            justify-center
            text-white
            font-bold
            shadow-md
            ${
              isCurrentUser
                ? "bg-indigo-600 ring-4 ring-indigo-300"
                : "bg-blue-500"
            }
          `}
        >
          {initials}
        </div>

        <div
          className={`
            absolute
            -bottom-1
            -right-1
            w-4
            h-4
            rounded-full
            border-2
            border-white
            ${statusColor}
          `}
        />

      </div>

      <span className="text-xs mt-2 text-center">

        {isCurrentUser && "👑 "}

        {nome}

      </span>

    </div>
  );
}