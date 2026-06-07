type Props = {
  x: number;
  y: number;
};

export default function Lake({
  x,
  y,
}: Props) {
  return (
    <div
      className="
        absolute
        flex
        h-32
        w-48
        items-center
        justify-center
        rounded-full
        border-4
        border-blue-400
        bg-blue-200
      "
      style={{
        left: x,
        top: y,
      }}
    >
      Lago
    </div>
  );
}