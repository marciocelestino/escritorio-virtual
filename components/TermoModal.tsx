"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionToken } from "@/lib/session";

type LetterState = "correct" | "present" | "absent";

type GuessRow = {
  word: string;
  result: LetterState[];
};

type TodayView = {
  day: string;
  wordLength: number;
  maxAttempts: number;
  attemptsUsed: number;
  guesses: GuessRow[];
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

type LeaderboardEntry = {
  userId: number;
  nome: string;
  attempts: number;
  solvedAt: number;
};

type Props = {
  currentUserId: number;
  onClose: () => void;
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

const STATE_PRIORITY: Record<LetterState, number> = {
  absent: 0,
  present: 1,
  correct: 2,
};

function computeKeyStates(
  guesses: GuessRow[]
): Record<string, LetterState> {

  const states: Record<string, LetterState> = {};

  for (const guess of guesses) {

    for (let i = 0; i < guess.word.length; i++) {

      const letter = guess.word[i];
      const state = guess.result[i];

      if (
        !states[letter] ||
        STATE_PRIORITY[state] >
          STATE_PRIORITY[states[letter]]
      ) {
        states[letter] = state;
      }

    }

  }

  return states;

}

function tileClasses(state?: LetterState) {

  if (state === "correct") {
    return "border-green-600 bg-green-600 text-white";
  }

  if (state === "present") {
    return "border-yellow-500 bg-yellow-500 text-white";
  }

  if (state === "absent") {
    return "border-slate-400 bg-slate-400 text-white dark:border-slate-600 dark:bg-slate-600";
  }

  return "border-slate-300 text-slate-900 dark:border-slate-600 dark:text-slate-100";

}

function keyClasses(state?: LetterState) {

  if (state === "correct") {
    return "bg-green-600 text-white";
  }

  if (state === "present") {
    return "bg-yellow-500 text-white";
  }

  if (state === "absent") {
    return "bg-slate-400 text-white dark:bg-slate-600";
  }

  return "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600";

}

function buildShareText(view: TodayView) {

  const grid = view.guesses
    .map((guess) =>
      guess.result
        .map((state) =>
          state === "correct"
            ? "🟩"
            : state === "present"
            ? "🟨"
            : "⬛"
        )
        .join("")
    )
    .join("\n");

  const score = view.solved
    ? `${view.attemptsUsed}/${view.maxAttempts}`
    : `X/${view.maxAttempts}`;

  return `Termo do Dia — Internit Office\n${score}\n\n${grid}`;

}

export default function TermoModal({
  currentUserId,
  onClose,
}: Props) {

  const [view, setView] = useState<
    TodayView | null
  >(null);

  const [leaderboard, setLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);

  const [currentGuess, setCurrentGuess] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [copied, setCopied] = useState(false);

  // Mostra a explicação sozinha na primeira vez que a pessoa abre o
  // jogo (localStorage, por navegador) — depois disso só reaparece se
  // ela clicar no "❓" de novo.
  const [showHelp, setShowHelp] = useState(
    () =>
      typeof window !== "undefined" &&
      !localStorage.getItem(
        "termoAjudaVista"
      )
  );

  function dismissHelp() {

    localStorage.setItem(
      "termoAjudaVista",
      "true"
    );

    setShowHelp(false);

  }

  const loadToday = useCallback(async () => {

    const token = getSessionToken();

    const res = await fetch("/api/termo/today", {
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
      },
    });

    if (!res.ok) {
      setErrorMessage(
        "Não foi possível carregar o Termo de hoje."
      );
      return;
    }

    setView(await res.json());

  }, []);

  const loadLeaderboard = useCallback(async () => {

    const token = getSessionToken();

    const res = await fetch(
      "/api/termo/leaderboard",
      {
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
        },
      }
    );

    if (!res.ok) {
      return;
    }

    const data = await res.json();

    setLeaderboard(data.entries ?? []);

  }, []);

  useEffect(() => {

    // setTimeout em vez de chamar direto: o lint acusa "setState
    // síncrono dentro de efeito" (cascata de renders) — adiar pra
    // depois do commit deste efeito evita isso (mesmo padrão usado em
    // app/office/page.tsx).
    const timeoutId = setTimeout(() => {
      loadToday();
      loadLeaderboard();
    }, 0);

    return () => clearTimeout(timeoutId);

  }, [loadToday, loadLeaderboard]);

  const handleSubmit = useCallback(async () => {

    if (!view || view.finished || submitting) {
      return;
    }

    if (currentGuess.length !== view.wordLength) {
      setErrorMessage(
        `Complete as ${view.wordLength} letras.`
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const token = getSessionToken();

    const res = await fetch("/api/termo/guess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        guess: currentGuess,
      }),
    });

    const data = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setErrorMessage(
        data.error ??
          "Não foi possível enviar o palpite."
      );
      return;
    }

    setView(data);
    setCurrentGuess("");

    if (data.finished) {
      loadLeaderboard();
    }

  }, [
    view,
    submitting,
    currentGuess,
    loadLeaderboard,
  ]);

  useEffect(() => {

    if (!view || view.finished) {
      return;
    }

    function handleKeyDown(
      e: KeyboardEvent
    ) {

      if (e.key === "Enter") {
        handleSubmit();
        return;
      }

      if (e.key === "Backspace") {
        setCurrentGuess((prev) =>
          prev.slice(0, -1)
        );
        return;
      }

      const letter = e.key.toUpperCase();

      if (
        /^[A-Z]$/.test(letter) &&
        view
      ) {
        setCurrentGuess((prev) =>
          prev.length < view.wordLength
            ? prev + letter
            : prev
        );
      }

    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

  }, [view, handleSubmit]);

  function handleVirtualKey(key: string) {

    if (!view || view.finished) {
      return;
    }

    if (key === "ENTER") {
      handleSubmit();
      return;
    }

    if (key === "BACK") {
      setCurrentGuess((prev) =>
        prev.slice(0, -1)
      );
      return;
    }

    setCurrentGuess((prev) =>
      prev.length < view.wordLength
        ? prev + key
        : prev
    );

  }

  async function handleShare() {

    if (!view) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        buildShareText(view)
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        2000
      );

    } catch {
      // Sem permissão de clipboard ou navegador sem suporte — sem
      // problema, só não mostra a confirmação de "copiado".
    }

  }

  const keyStates = view
    ? computeKeyStates(view.guesses)
    : {};

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-md
          flex-col
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-xl
          dark:bg-slate-900
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            gap-2
            border-b
            p-4
            dark:border-white/10
          "
        >

          <h2 className="font-bold text-slate-900 dark:text-slate-100">
            🔤 Termo do Dia
          </h2>

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setShowHelp((current) => !current)
              }
              title="Como jogar"
              aria-label="Como jogar"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              ❓
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              ✕
            </button>

          </div>

        </div>

        {showHelp ? (

          <div className="flex flex-col gap-3 p-4 text-sm text-slate-700 dark:text-slate-300">

            <p>
              Adivinhe a palavra secreta de{" "}
              <strong>5 letras</strong> em até{" "}
              <strong>6 tentativas</strong>.
              Depois de cada palpite, as letras
              mudam de cor pra te dar uma pista:
            </p>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded border-2 text-sm font-bold ${tileClasses(
                  "correct"
                )}`}
              >
                P
              </div>
              <span>
                <strong>Verde</strong> — a letra
                está certa, na posição certa.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded border-2 text-sm font-bold ${tileClasses(
                  "present"
                )}`}
              >
                R
              </div>
              <span>
                <strong>Amarelo</strong> — a
                letra existe na palavra, mas em
                outra posição.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded border-2 text-sm font-bold ${tileClasses(
                  "absent"
                )}`}
              >
                Z
              </div>
              <span>
                <strong>Cinza</strong> — a letra
                não está na palavra.
              </span>
            </div>

            <p>
              A palavra é a{" "}
              <strong>
                mesma pra todo mundo
              </strong>{" "}
              e muda à meia-noite — todo mundo
              disputa quem acerta em menos
              tentativas (veja o placar
              &quot;Quem já acertou
              hoje&quot;). Não precisa se
              preocupar com acento: digitar
              &quot;irmao&quot; também vale pra
              &quot;irmão&quot;.
            </p>

            <button
              onClick={dismissHelp}
              className="
                mt-1
                self-start
                rounded-lg
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-900
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-100
              "
            >
              Entendi, vamos jogar!
            </button>

          </div>

        ) : (

        <div className="flex flex-col items-center gap-4 p-4">

          {!view && !errorMessage && (
            <p className="text-sm text-slate-400">
              Carregando...
            </p>
          )}

          {errorMessage && !view && (
            <p className="text-sm text-red-500">
              {errorMessage}
            </p>
          )}

          {view && (

            <>

              <div className="flex flex-col gap-1">

                {Array.from(
                  { length: view.maxAttempts },
                  (_, rowIndex) => {

                    const guess =
                      view.guesses[rowIndex];

                    const isCurrentRow =
                      !guess &&
                      rowIndex ===
                        view.guesses.length &&
                      !view.finished;

                    const rowLetters = guess
                      ? guess.word.split("")
                      : isCurrentRow
                      ? currentGuess
                          .padEnd(
                            view.wordLength,
                            " "
                          )
                          .split("")
                      : Array(
                          view.wordLength
                        ).fill(" ");

                    return (
                      <div
                        key={rowIndex}
                        className="flex gap-1"
                      >

                        {rowLetters.map(
                          (letter, colIndex) => (

                            <div
                              key={colIndex}
                              className={`
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded
                                border-2
                                text-lg
                                font-bold
                                uppercase
                                ${tileClasses(
                                  guess
                                    ?.result[
                                    colIndex
                                  ]
                                )}
                              `}
                            >
                              {letter.trim()}
                            </div>

                          )
                        )}

                      </div>
                    );

                  }
                )}

              </div>

              {errorMessage && (
                <p className="text-sm text-red-500">
                  {errorMessage}
                </p>
              )}

              {view.finished && (

                <div className="text-center text-sm">

                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {view.solved
                      ? `🎉 Você acertou em ${view.attemptsUsed} tentativa${
                          view.attemptsUsed === 1
                            ? ""
                            : "s"
                        }!`
                      : `Não foi dessa vez — a palavra era ${view.answer}.`}
                  </p>

                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    🔥 Sequência: {view.stats.streak}
                    {" · "}
                    Recorde: {view.stats.maxStreak}
                    {" · "}
                    Vitórias: {view.stats.totalWins}/
                    {view.stats.totalPlayed}
                  </p>

                  <button
                    onClick={handleShare}
                    className="
                      mt-3
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-2
                      text-sm
                      font-medium
                      text-slate-900
                      hover:bg-slate-50
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:text-slate-100
                    "
                  >
                    {copied
                      ? "Copiado!"
                      : "Compartilhar resultado"}
                  </button>

                </div>

              )}

              {!view.finished && (

                <div className="flex flex-col gap-1">

                  {KEYBOARD_ROWS.map(
                    (row, rowIndex) => (

                      <div
                        key={rowIndex}
                        className="flex justify-center gap-1"
                      >

                        {row.map((key) => (

                          <button
                            key={key}
                            onClick={() =>
                              handleVirtualKey(
                                key
                              )
                            }
                            className={`
                              rounded
                              px-2
                              py-3
                              text-xs
                              font-semibold
                              ${
                                key ===
                                  "ENTER" ||
                                key === "BACK"
                                  ? "min-w-[3rem]"
                                  : "min-w-[2rem]"
                              }
                              ${keyClasses(
                                keyStates[key]
                              )}
                            `}
                          >
                            {key === "BACK"
                              ? "⌫"
                              : key === "ENTER"
                              ? "OK"
                              : key}
                          </button>

                        ))}

                      </div>

                    )
                  )}

                </div>

              )}

              {leaderboard.length > 0 && (

                <div className="w-full border-t pt-3 dark:border-white/10">

                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Quem já acertou hoje
                  </h3>

                  <ul className="space-y-1 text-sm">

                    {leaderboard.map(
                      (entry, index) => (

                        <li
                          key={entry.userId}
                          className={`
                            flex
                            justify-between
                            ${
                              entry.userId ===
                              currentUserId
                                ? "font-semibold text-blue-600 dark:text-blue-400"
                                : "text-slate-700 dark:text-slate-300"
                            }
                          `}
                        >
                          <span>
                            {index + 1}.{" "}
                            {entry.userId ===
                            currentUserId
                              ? "Você"
                              : entry.nome}
                          </span>
                          <span>
                            {entry.attempts}/
                            {view.maxAttempts}
                          </span>
                        </li>

                      )
                    )}

                  </ul>

                </div>

              )}

            </>

          )}

        </div>

        )}

      </div>

    </div>
  );

}
