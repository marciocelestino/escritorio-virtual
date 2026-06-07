type Props = {
  x: number;
  y: number;
};

export default function Desk({
  x,
  y,
}: Props) {
  return (
    <div
      className="
        absolute
        flex
        h-24
        w-40
        items-center
        justify-center
        rounded-xl
        border
        bg-slate-200
        font-semibold
      "
      style={{
        left: x,
        top: y,
      }}
    >
      Mesa
    </div>
  );
}