import fs from "fs";
import path from "path";
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  isWordInList,
  normalizeGuess,
  scoreGuess,
  todayKey,
  wordForDay,
} from "./termo";

// Mesmo padrão de data/usuarios-db.json e data/mensagens-db.json — um
// arquivo JSON simples, lido/escrito com tmp+rename atômico.
function resolveTermoFilePath() {

  if (process.env.TERMO_PATH) {
    return process.env.TERMO_PATH;
  }

  if (fs.existsSync("/data")) {
    return path.join("/data", "termo.json");
  }

  return path.join(
    process.cwd(),
    "data",
    "termo-db.json"
  );

}

export type TermoRecord = {
  day: string;
  guesses: string[];
  solved: boolean;
  finished: boolean;
  solvedAt?: number;
  streak: number;
  maxStreak: number;
  totalWins: number;
  totalPlayed: number;
};

type TermoData = Record<string, TermoRecord>;

let cached: TermoData | null = null;
let filePath: string | null = null;

function loadData(): TermoData {

  if (cached) {
    return cached;
  }

  filePath = resolveTermoFilePath();

  fs.mkdirSync(path.dirname(filePath), {
    recursive: true,
  });

  if (fs.existsSync(filePath)) {

    cached = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

  } else {

    cached = {};
    persistData();

  }

  return cached as TermoData;

}

function persistData() {

  if (!filePath || !cached) {
    return;
  }

  const tmpPath = `${filePath}.tmp`;

  fs.writeFileSync(
    tmpPath,
    JSON.stringify(cached, null, 2)
  );

  fs.renameSync(tmpPath, filePath);

}

function isDayBefore(
  earlierDay: string,
  laterDay: string
): boolean {

  const earlierMs = Date.parse(
    `${earlierDay}T00:00:00Z`
  );

  const laterMs = Date.parse(
    `${laterDay}T00:00:00Z`
  );

  return laterMs - earlierMs === 86_400_000;

}

// Garante que o registro do usuário reflete o dia de hoje — se ele
// ainda estiver no dia anterior (ou mais antigo), "vira a página":
// zera as tentativas de hoje e decide se a sequência (streak) continua
// ou quebra.
function ensureTodayRecord(
  userId: number
): TermoRecord {

  const data = loadData();
  const key = String(userId);
  const today = todayKey();
  const existing = data[key];

  if (existing && existing.day === today) {
    return existing;
  }

  const keepStreak = Boolean(
    existing &&
      existing.solved &&
      isDayBefore(existing.day, today)
  );

  const fresh: TermoRecord = {
    day: today,
    guesses: [],
    solved: false,
    finished: false,
    streak: keepStreak
      ? existing!.streak
      : 0,
    maxStreak: existing?.maxStreak ?? 0,
    totalWins: existing?.totalWins ?? 0,
    totalPlayed: existing?.totalPlayed ?? 0,
  };

  data[key] = fresh;

  persistData();

  return fresh;

}

export type TermoPublicView = {
  day: string;
  wordLength: number;
  maxAttempts: number;
  attemptsUsed: number;
  guesses: Array<{
    word: string;
    result: ReturnType<typeof scoreGuess>;
  }>;
  solved: boolean;
  finished: boolean;
  answer?: string;
  stats: {
    streak: number;
    maxStreak: number;
    totalWins: number;
    totalPlayed: number;
  };
};

function toPublicView(
  record: TermoRecord
): TermoPublicView {

  const secret = wordForDay(record.day);

  return {
    day: record.day,
    wordLength: WORD_LENGTH,
    maxAttempts: MAX_ATTEMPTS,
    attemptsUsed: record.guesses.length,
    guesses: record.guesses.map((word) => ({
      word,
      result: scoreGuess(secret, word),
    })),
    solved: record.solved,
    finished: record.finished,
    answer: record.finished
      ? secret
      : undefined,
    stats: {
      streak: record.streak,
      maxStreak: record.maxStreak,
      totalWins: record.totalWins,
      totalPlayed: record.totalPlayed,
    },
  };

}

export function getTodayView(
  userId: number
): TermoPublicView {

  return toPublicView(
    ensureTodayRecord(userId)
  );

}

export type GuessOutcome =
  | { ok: true; view: TermoPublicView }
  | { ok: false; error: "invalid-word" | "already-finished" };

export function submitGuess(
  userId: number,
  rawGuess: string
): GuessOutcome {

  const record = ensureTodayRecord(userId);

  if (record.finished) {
    return { ok: false, error: "already-finished" };
  }

  const guess = normalizeGuess(rawGuess);

  if (
    guess.length !== WORD_LENGTH ||
    !isWordInList(guess)
  ) {
    return { ok: false, error: "invalid-word" };
  }

  const wasFirstGuessToday =
    record.guesses.length === 0;

  record.guesses.push(guess);

  const secret = wordForDay(record.day);
  const win = guess === secret;

  if (win) {

    record.solved = true;
    record.finished = true;
    record.solvedAt = Date.now();
    record.streak += 1;
    record.maxStreak = Math.max(
      record.maxStreak,
      record.streak
    );
    record.totalWins += 1;

  } else if (
    record.guesses.length >= MAX_ATTEMPTS
  ) {

    record.finished = true;
    record.streak = 0;

  }

  if (wasFirstGuessToday) {
    record.totalPlayed += 1;
  }

  persistData();

  return { ok: true, view: toPublicView(record) };

}

export type LeaderboardEntry = {
  userId: number;
  attempts: number;
  solvedAt: number;
};

// Só quem já resolveu hoje entra no placar — de propósito não mostra
// quem está tentando/travado, só quem já bateu o martelo.
export function getTodayLeaderboard(): LeaderboardEntry[] {

  const data = loadData();
  const today = todayKey();

  const entries: LeaderboardEntry[] = Object.entries(
    data
  )
    .filter(
      ([, record]) =>
        record.day === today && record.solved
    )
    .map(([userId, record]) => ({
      userId: Number(userId),
      attempts: record.guesses.length,
      solvedAt: record.solvedAt ?? 0,
    }));

  entries.sort(
    (a, b) =>
      a.attempts - b.attempts ||
      a.solvedAt - b.solvedAt
  );

  return entries;

}
