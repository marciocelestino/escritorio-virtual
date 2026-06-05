type Props = {
  nome: string;
  onClick?: () => void;
};

export default function RoomCard({
  nome,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className="
        border
        rounded-lg
        p-4
        bg-white
        shadow-sm
        cursor-pointer
        hover:bg-slate-100
      "
    >
      <h3 className="font-semibold">
        {nome}
      </h3>
    </div>
  );
}