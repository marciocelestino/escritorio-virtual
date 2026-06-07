type Props = {
  x: number;
  y: number;
};

export default function Chair({
  x,
  y,
}: Props) {
  return (
    <div
      className="
        absolute
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        border
        bg-blue-200
      "
      style={{
        left: x,
        top: y,
      }}
    >
      💺
    </div>
  );
}