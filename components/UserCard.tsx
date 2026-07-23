type Props = {
  nome: string;
  status?: string;
  room?: string;
  onInvite?: () => void;
};

export default function UserCard({
  nome,
  status,
  room,
  onInvite,
}: Props) {
  const getStatusIcon = () => {
    switch (status) {
      case "Disponivel":
        return "🟢";

      case "Ausente":
        return "🟡";

      case "Reuniao":
        return "🔴";

      case "Almoco":
        return "🍽️";

      case "Ocioso":
        return "💤";

      default:
        return "⚪";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "Reuniao":
        return "Reunião";

      case "Almoco":
        return "Almoço";

      default:
        return status ?? "Disponível";
    }
  };

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-2
        border-b
        p-4
        dark:border-white/10
      "
    >
      <div>
        <div className="font-medium dark:text-slate-100">
          {nome}
        </div>

        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {getStatusIcon()} {getStatusLabel()}
          {room && (
            <span className="text-slate-400 dark:text-slate-500">
              {" "}
              · {room}
            </span>
          )}
        </div>
      </div>

      {onInvite && (
        <button
          onClick={onInvite}
          title={`Chamar ${nome} para esta sala`}
          className="
            shrink-0
            rounded-lg
            bg-slate-100
            px-2
            py-1
            text-xs
            font-medium
            text-slate-600
            hover:bg-slate-200
            dark:bg-slate-700
            dark:text-slate-300
            dark:hover:bg-slate-600
          "
        >
          Chamar aqui
        </button>
      )}
    </div>
  );
}
