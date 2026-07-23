type Props = {
  nome: string;
  status?: string;
  isCurrentUser: boolean;
  avatarTipo?: string | null;
  avatarValor?: string | null;
  onClick: () => void;
};

// Item de uma grade de assentos (CSS grid, não posicionamento absoluto em
// px) — assim a sala encolhe/cresce de verdade com a largura disponível,
// em vez de precisar de rolagem horizontal em telas menores.
export default function PositionedAvatar({
  nome,
  status = "Disponivel",
  isCurrentUser = false,
  avatarTipo,
  avatarValor,
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
      className="
        flex
        cursor-pointer
        flex-col
        items-center
      "
    >

      <div className="relative">

        <div
          className={`
            flex
            h-10
            w-10
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
                ? "bg-indigo-600 ring-2 ring-indigo-300"
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
            <span className="text-base">
              {avatarValor}
            </span>
          ) : (
            initials
          )}
        </div>

        <div
          className={`
            absolute
            -bottom-0.5
            -right-0.5
            h-3
            w-3
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
          max-w-[64px]
          truncate
          text-center
          text-[10px]
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