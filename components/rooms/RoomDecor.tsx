// Lugar vazio e clicável — clicar senta o usuário atual ali. Mantém o
// mesmo formato de posicionamento (x/y absolutos) do PositionedAvatar
// pra poder trocar um pelo outro sem mexer no layout da sala.
export function EmptySeatMarker({
  x,
  y,
  onClick,
}: {
  x: number;
  y: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title="Sentar aqui"
      className="
        absolute
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        border-2
        border-dashed
        border-slate-300
        text-lg
        text-slate-300
        transition
        hover:border-blue-400
        hover:text-blue-400
        dark:border-slate-600
        dark:text-slate-600
        dark:hover:border-blue-400
        dark:hover:text-blue-400
      "
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      +
    </button>
  );
}
