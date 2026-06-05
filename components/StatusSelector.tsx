type Status =
  | "Disponivel"
  | "Ausente"
  | "Reuniao";

type Props = {
  status: Status;
  setStatus: (status: Status) => void;
};

export default function StatusSelector({
  status,
  setStatus
}: Props) {
  return (
    <select
      value={status}
      onChange={(e) =>
        setStatus(
          e.target.value as Status
        )
      }
      className="
        rounded-lg
        border
        bg-white
        px-3
        py-2
      "
    >
      <option value="Disponivel">
        🟢 Disponível
      </option>

      <option value="Ausente">
        🟡 Ausente
      </option>

      <option value="Reuniao">
        🔴 Reunião
      </option>
    </select>
  );
}