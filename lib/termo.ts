import { WORDS } from "./termoWords";

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export type LetterState = "correct" | "present" | "absent";

// Data-base fixa só pra ter um ponto de partida estável pro cálculo de
// "quantos dias se passaram" — não precisa guardar em lugar nenhum qual
// é a palavra de hoje, ela é sempre recalculada a partir da data.
const EPOCH_MS = Date.parse("2026-01-01T00:00:00Z");

// Vira meia-noite em UTC, não no horário de Brasília — simplificação de
// propósito (evita depender de fuso horário/bibliotecas extras); na
// prática a virada do dia acontece 3h mais cedo que a meia-noite local.
export function todayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function wordForDay(dayKey: string): string {

  const dayMs = Date.parse(`${dayKey}T00:00:00Z`);

  const daysSinceEpoch = Math.floor(
    (dayMs - EPOCH_MS) / 86_400_000
  );

  const index =
    ((daysSinceEpoch % WORDS.length) +
      WORDS.length) %
    WORDS.length;

  return WORDS[index];
}

const DIACRITICS_PATTERN = new RegExp(
  "[\\u0300-\\u036f]",
  "g"
);

// Normaliza uma tentativa: maiúsculas, sem acento (pra quem digitar
// "IRMÃO" ainda acertar contra a lista sem acento "IRMAO").
export function normalizeGuess(raw: string): string {

  return raw
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toUpperCase()
    .trim();

}

export function isWordInList(guess: string): boolean {
  return WORDS.includes(guess);
}

// Algoritmo padrão do Wordle/Termo — trata letras repetidas
// corretamente (uma letra só conta como "presente" o número de vezes
// que ela aparece na palavra secreta, não a cada repetição no chute).
export function scoreGuess(
  secret: string,
  guess: string
): LetterState[] {

  const result: LetterState[] = Array(
    WORD_LENGTH
  ).fill("absent");

  const secretLetters = secret.split("");
  const guessLetters = guess.split("");
  const usedInSecret = Array(WORD_LENGTH).fill(
    false
  );

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === secretLetters[i]) {
      result[i] = "correct";
      usedInSecret[i] = true;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {

    if (result[i] === "correct") {
      continue;
    }

    const matchIndex = secretLetters.findIndex(
      (letter, j) =>
        letter === guessLetters[i] &&
        !usedInSecret[j]
    );

    if (matchIndex !== -1) {
      result[i] = "present";
      usedInSecret[matchIndex] = true;
    }

  }

  return result;

}
