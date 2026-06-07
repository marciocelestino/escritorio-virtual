type Props = {
  x: number;
  y: number;
};

export default function Sofa({
  x,
  y,
}: Props) {
  return (
    <div
      className="
        absolute
        flex
        h-20
        w-28
        items-center
        justify-center
        rounded-lg
        border
        bg-orange-200
      "
      style={{
        left: x,
        top: y,
      }}
    >
      Sofá
    </div>
  );
}