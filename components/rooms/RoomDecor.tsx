// Selo colorido por tipo de sala (ícone num círculo), no lugar do emoji
// solto no título — mesma ideia do mockup enviado.
export function RoomBadge({
  icon,
  colorClass,
}: {
  icon: string;
  colorClass: string;
}) {
  return (
    <span
      className={`
        flex
        h-7
        w-7
        shrink-0
        items-center
        justify-center
        rounded-full
        text-sm
        ${colorClass}
      `}
    >
      {icon}
    </span>
  );
}

// Mesmo tamanho/posição do RoomBadge, mas mostrando o avatar de verdade do
// dono da sala (foto/emoji/iniciais) em vez de um ícone genérico — usado
// nas salas pessoais ("Espaço Fulano"), onde cada sala já tem um dono
// certo.
export function OwnerAvatarBadge({
  nome,
  avatarTipo,
  avatarValor,
}: {
  nome: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
}) {

  const initials =
    nome
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <span
      className="
        flex
        h-7
        w-7
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-full
        bg-blue-600
        text-xs
        font-bold
        text-white
      "
    >

      {avatarTipo === "foto" && avatarValor ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarValor}
          alt={nome}
          className="h-full w-full object-cover"
        />
      ) : avatarTipo === "emoji" &&
        avatarValor ? (
        <span className="text-sm">
          {avatarValor}
        </span>
      ) : (
        initials
      )}

    </span>
  );
}

export const ROOM_BADGE_COLORS = {
  reuniao:
    "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  pessoal:
    "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
};

// Lugar vazio e clicável — clicar senta o usuário atual ali. Item de uma
// grade de assentos (CSS grid), não posicionamento absoluto, pra sala
// encolher/crescer com a largura disponível em vez de precisar de
// rolagem horizontal.
//
// O Espaço Natureza tem fundo verde escuro sempre (não muda com o tema
// claro/escuro do resto do app), então usa a variante "nature": um verde
// bem mais claro, pensado pra contrastar nesse fundo — as outras salas
// usam a variante padrão (cinza/azul, sensível ao tema).
export function EmptySeatMarker({
  onClick,
  variant = "default",
}: {
  onClick: () => void;
  variant?: "default" | "nature";
}) {
  return (
    <button
      onClick={onClick}
      title="Sentar aqui"
      className={`
        mx-auto
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        border-2
        border-dashed
        text-base
        transition
        ${
          variant === "nature"
            ? "border-emerald-300/50 text-emerald-300/70 hover:border-emerald-200 hover:text-emerald-200"
            : "border-slate-300 text-slate-300 hover:border-blue-400 hover:text-blue-400 dark:border-slate-600 dark:text-slate-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
        }
      `}
    >
      +
    </button>
  );
}
