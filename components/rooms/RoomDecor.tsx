// Peças de piso ilustradas em CSS puro, usadas pelas salas no lugar dos
// emojis de decoração (🚪🛋️🌳🦆🖥️💺) — mesmo espírito, sem depender da
// fonte de emoji do sistema operacional do usuário.

export function DoorDecor() {
  return (
    <div
      className="
        relative
        h-24
        w-16
        rounded-t-2xl
        border-2
        border-amber-800/30
        bg-gradient-to-b
        from-amber-100
        to-amber-200
        shadow-sm
      "
    >
      <div className="absolute inset-2 rounded-t-xl border border-amber-800/20" />
      <div className="absolute right-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-800/40" />
    </div>
  );
}

export function SofaDecor() {
  return (
    <div
      className="
        flex
        h-14
        w-28
        items-end
        gap-1
        rounded-2xl
        bg-blue-100
        p-1.5
        shadow-sm
      "
    >
      <div className="h-full w-4 rounded-xl bg-blue-300" />
      <div className="h-9 flex-1 rounded-xl bg-blue-200" />
      <div className="h-full w-4 rounded-xl bg-blue-300" />
    </div>
  );
}

export function PlantDecor() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        <div
          className="h-10 w-3 rounded-full bg-green-600"
          style={{ transform: "rotate(-18deg)" }}
        />
        <div className="h-12 w-3 rounded-full bg-green-700" />
        <div
          className="h-10 w-3 rounded-full bg-green-600"
          style={{ transform: "rotate(18deg)" }}
        />
      </div>
      <div className="h-6 w-9 rounded-b-lg rounded-t-sm border border-orange-300 bg-orange-200" />
    </div>
  );
}

function MonitorShape() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-9 w-12 rounded-md border-2 border-slate-500 bg-slate-700" />
      <div className="h-1.5 w-3 bg-slate-400" />
      <div className="h-1 w-9 rounded-full bg-slate-400" />
    </div>
  );
}

export function DesksDecor() {
  return (
    <div className="flex gap-4">
      <MonitorShape />
      <MonitorShape />
    </div>
  );
}

export function ChairDecor() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-8 w-8 rounded-t-full bg-slate-600" />
      <div className="h-3 w-10 rounded-full bg-slate-500" />
      <div className="h-3 w-1 rounded-full bg-slate-400" />
    </div>
  );
}

export function TreeDecor() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-14 w-14 rounded-full bg-green-600 shadow-sm" />
      <div className="h-6 w-2.5 rounded-sm bg-amber-800" />
    </div>
  );
}

export function GrassDecor() {
  return (
    <div className="flex items-end gap-0.5">
      <div
        className="h-6 w-1.5 rounded-full bg-green-500"
        style={{ transform: "rotate(-12deg)" }}
      />
      <div className="h-8 w-1.5 rounded-full bg-green-600" />
      <div
        className="h-6 w-1.5 rounded-full bg-green-500"
        style={{ transform: "rotate(12deg)" }}
      />
    </div>
  );
}

function DuckDecor({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative h-4 w-6 ${className ?? ""}`}
    >
      <div className="absolute bottom-0 left-0 h-3 w-5 rounded-full bg-white shadow-sm" />
      <div className="absolute -top-1 right-0 h-2.5 w-2.5 rounded-full bg-white" />
      <div className="absolute right-[-2px] top-[-0.5px] h-1 w-1.5 rounded-sm bg-orange-400" />
    </div>
  );
}

export function PondDecor() {
  return (
    <div
      className="
        relative
        flex
        h-28
        w-44
        items-center
        justify-center
        rounded-[50%]
        border-4
        border-sky-300
        bg-gradient-to-b
        from-sky-100
        to-sky-200
        shadow-inner
      "
    >
      <span className="text-sm font-semibold text-sky-700">
        Lago
      </span>

      <DuckDecor className="absolute -left-1 top-4" />
      <DuckDecor className="absolute bottom-3 right-5" />
    </div>
  );
}
