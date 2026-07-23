type Props = {
  nome: string;
  status?: string;
  isCurrentUser: boolean;
  avatarTipo?: string | null;
  avatarValor?: string | null;
  x: number;
  y: number;
  onClick: () => void;
};

export default function PositionedAvatar({
  nome,
  status = "Disponivel",
  isCurrentUser = false,
  avatarTipo,
  avatarValor,
  x,
  y,
  onClick,
}: Props) {

  const initials =
    nome
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const statusColor = {
    Disponivel: "bg-green-500",
    Ausente: "bg-yellow-500",
    Reuniao: "bg-red-500",
    Almoco: "bg-orange-500",
    Ocioso: "bg-slate-400",
  }[status] || "bg-slate-400";

  return (
    <div
  onClick={onClick}
      className="cursor-pointer
        absolute
        flex
        flex-col
        items-center
      "
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >

      <div className="relative">

        <div
          className={`
            flex
            h-12
            w-12
            items-center
            justify-center
            overflow-hidden
            rounded-full
            text-sm
            font-bold
            text-white
            shadow-md

            ${
              isCurrentUser
                ? "bg-indigo-600 ring-4 ring-indigo-300"
                : "bg-blue-600"
            }
          `}
        >
          {avatarTipo === "foto" &&
          avatarValor ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarValor}
              alt={nome}
              className="h-full w-full object-cover"
            />
          ) : avatarTipo === "emoji" &&
            avatarValor ? (
            <span className="text-xl">
              {avatarValor}
            </span>
          ) : (
            initials
          )}
        </div>

        <div
          className={`
            absolute
            -bottom-1
            -right-1
            h-4
            w-4
            rounded-full
            border-2
            border-white
            dark:border-slate-800
            ${statusColor}
          `}
        />

      </div>

      <span
        className="
          mt-1
          text-xs
          font-medium
          text-slate-900
          dark:text-slate-100
        "
      >
        {isCurrentUser && "👑 "}
        {nome}
      </span>

    </div>
  );
}