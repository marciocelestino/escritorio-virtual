import type { ReactNode } from "react";

// Marcação "markdown-lite" pro pequeno editor do Chat Geral — negrito,
// sublinhado e link, nada mais. De propósito NÃO é HTML: o texto salvo é
// sempre uma string simples (**negrito**, __sublinhado__,
// [texto](url)), e essa função interpreta esses marcadores construindo
// elementos React diretamente, sem passar por dangerouslySetInnerHTML em
// nenhum momento — não tem como injetar HTML/script por aqui.
const PATTERN =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*([^\n*]+)\*\*|__([^\n_]+)__/g;

export function renderRichText(
  text: string
): ReactNode[] {

  const nodes: ReactNode[] = [];

  let lastIndex = 0;
  let key = 0;

  PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;

  while (
    (match = PATTERN.exec(text)) !== null
  ) {

    if (match.index > lastIndex) {
      nodes.push(
        text.slice(lastIndex, match.index)
      );
    }

    const [
      ,
      linkText,
      linkHref,
      bold,
      underline,
    ] = match;

    if (linkText !== undefined) {

      nodes.push(
        <a
          key={key++}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          {linkText}
        </a>
      );

    } else if (bold !== undefined) {

      nodes.push(
        <strong key={key++}>{bold}</strong>
      );

    } else if (underline !== undefined) {

      nodes.push(
        <u key={key++}>{underline}</u>
      );

    }

    lastIndex = PATTERN.lastIndex;

  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
