type Props = {
  nome: string;
  status?: string;
};

export default function UserCard({
  nome,
  status
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
        border-b
        p-4
      "
    >
      <div className="font-medium">
        {nome}
      </div>

      <div className="mt-1 text-sm text-slate-500">
        {getStatusIcon()} {status ?? "Disponível"}
      </div>
    </div>
  );
}