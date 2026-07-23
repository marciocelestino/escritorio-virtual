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
        left-1/2
        z-[60]
        -translate-x-1/2
        rounded-xl
        border
        border-slate-200
        bg-white
        px-5
        py-3
        text-slate-900
        shadow-xl
        animate-pulse
      "
    >
      🔔 {message}
    </div>
  );
}