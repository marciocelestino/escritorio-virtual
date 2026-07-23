type Props = {
  message: string;
};

export default function Notification({
  message,
}: Props) {
  return (
    <div
      className="
        fixed
        top-5
        right-5
        z-[60]
        rounded-xl
        bg-blue-600
        px-5
        py-3
        text-white
        shadow-xl
        animate-pulse
      "
    >
      🔔 {message}
    </div>
  );
}