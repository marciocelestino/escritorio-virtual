export type RosterUser = {
  id: number;
  nome: string;
};

// Acha sugestões de @menção a partir do texto digitado até o cursor —
// usado tanto no MentionInput (chat de sala/DM) quanto no Chat Geral.
export function computeMentionSuggestions(
  text: string,
  cursorPos: number,
  roster: RosterUser[]
): RosterUser[] {

  const uptoCursor = text.slice(0, cursorPos);

  const match = uptoCursor.match(/@(\w*)$/);

  if (!match) {
    return [];
  }

  const partial = match[1].toLowerCase();

  return roster
    .filter((user) => {

      const firstName = user.nome
        .split(" ")[0]
        .toLowerCase();

      return (
        firstName.startsWith(partial) ||
        user.nome.toLowerCase().startsWith(partial)
      );

    })
    .slice(0, 6);

}

// Substitui o token parcial "@algo" (antes do cursor) pelo primeiro nome
// da pessoa escolhida, devolvendo o novo texto e onde o cursor deve ficar.
export function insertMention(
  text: string,
  cursorPos: number,
  user: RosterUser
): { newText: string; newCursorPos: number } {

  const uptoCursor = text.slice(0, cursorPos);

  const firstName = user.nome.split(" ")[0];

  const replaced = uptoCursor.replace(
    /@(\w*)$/,
    `@${firstName} `
  );

  return {
    newText: replaced + text.slice(cursorPos),
    newCursorPos: replaced.length,
  };

}
