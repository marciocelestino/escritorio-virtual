type Props = {
  x: number;
  y: number;
};

export default function Tree({
  x,
  y,
}: Props) {
  return (
    <div
      className="
        absolute
        text-5xl
      "
      style={{
        left: x,
        top: y,
      }}
    >
      🌳
    </div>
  );
}