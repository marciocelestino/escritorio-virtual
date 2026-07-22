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

      default:
        return "⚪";
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
      "
    >
      <div>
        <div className="font-medium">
          {nome}
        </div>

        <div className="mt-1 text-sm text-slate-500">
          {getStatusIcon()} {status ?? "Disponível"}
          {room && (
            <span className="text-slate-400">
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
          "
        >
          Chamar aqui
        </button>
      )}
    </div>
  );
}
