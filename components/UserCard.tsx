type Props = {
  nome: string;
  status?: string;
  onInvite?: () => void;
  onOpenDm?: () => void;
  unreadDmCount?: number;
  spotifyTrack?: {
    nome: string;
    artista: string;
  } | null;
};

export default function UserCard({
  nome,
  status,
  onInvite,
  onOpenDm,
  unreadDmCount = 0,
  spotifyTrack,
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
        <div className="text-xs font-medium dark:text-slate-100">
          {nome}
        </div>

        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
          {getStatusIcon()} {getStatusLabel()}
        </div>

        {spotifyTrack && (
          <div
            className="mt-1 max-w-[11rem] truncate text-[10px] text-emerald-600 dark:text-emerald-400"
            title={`${spotifyTrack.nome} - ${spotifyTrack.artista}`}
          >
            🎵 {spotifyTrack.nome}
            {spotifyTrack.artista
              ? ` - ${spotifyTrack.artista}`
              : ""}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">

        {onOpenDm && (
          <button
            onClick={onOpenDm}
            title={`Mensagem direta para ${nome}`}
            className="
              relative
              rounded-lg
              border
              border-slate-300
              bg-white
              px-2
              py-1
              text-xs
              font-medium
              text-slate-900
              transition
              hover:bg-slate-50
            "
          >
            💬

            {unreadDmCount > 0 && (
              <span
                className="
                  absolute
                  -right-1.5
                  -top-1.5
                  flex
                  h-4
                  min-w-4
                  items-center
                  justify-center
                  rounded-full
                  bg-red-600
                  px-1
                  text-[10px]
                  font-bold
                  leading-none
                  text-white
                "
              >
                {unreadDmCount > 9
                  ? "9+"
                  : unreadDmCount}
              </span>
            )}
          </button>
        )}

        {onInvite && (
          <button
            onClick={onInvite}
            title={`Chamar ${nome} para esta sala`}
            className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-2
              py-1
              text-xs
              font-medium
              text-slate-900
              transition
              hover:bg-slate-50
            "
          >
            Chamar
          </button>
        )}

      </div>
    </div>
  );
}
