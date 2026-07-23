"use client";

import { useRef, useState } from "react";
import {
  computeMentionSuggestions,
  insertMention,
  type RosterUser,
} from "@/lib/mentionSuggestions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  roster: RosterUser[];
  placeholder?: string;
  title?: string;
};

// Campo de texto com autocomplete de @menção — digitar "@" mostra uma
// lista de nomes (do elenco passado) pra escolher, em vez de precisar
// acertar o primeiro nome de cabeça. A detecção de quem foi mencionado
// (pra disparar notificação) continua sendo por texto (@PrimeiroNome),
// então isso funciona tanto escolhendo da lista quanto digitando na mão.
export default function MentionInput({
  value,
  onChange,
  onSubmit,
  roster,
  placeholder,
  title,
}: Props) {

  const [suggestions, setSuggestions] =
    useState<RosterUser[]>([]);

  const inputRef =
    useRef<HTMLInputElement>(null);

  function updateSuggestions(
    text: string,
    cursorPos: number
  ) {

    setSuggestions(
      computeMentionSuggestions(
        text,
        cursorPos,
        roster
      )
    );

  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {

    const newValue = e.target.value;

    onChange(newValue);

    updateSuggestions(
      newValue,
      e.target.selectionStart ??
        newValue.length
    );

  }

  function pickSuggestion(
    user: RosterUser
  ) {

    const cursorPos =
      inputRef.current?.selectionStart ??
      value.length;

    const { newText } = insertMention(
      value,
      cursorPos,
      user
    );

    onChange(newText);

    setSuggestions([]);

    inputRef.current?.focus();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {

    if (
      e.key === "Enter" &&
      suggestions.length === 0
    ) {
      e.preventDefault();
      onSubmit();
    }

  }

  return (
    <div className="relative flex-1">

      {suggestions.length > 0 && (

        <div
          className="
            absolute
            bottom-full
            left-0
            mb-1
            w-full
            overflow-hidden
            rounded-lg
            border
            border-slate-200
            bg-white
            shadow-lg
          "
        >

          {suggestions.map((user) => (

            <button
              key={user.id}
              type="button"
              onClick={() =>
                pickSuggestion(user)
              }
              className="
                block
                w-full
                px-3
                py-2
                text-left
                text-sm
                text-slate-700
                hover:bg-slate-100
              "
            >
              @{user.nome}
            </button>

          ))}

        </div>

      )}

      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        title={title}
        maxLength={500}
        className="
          w-full
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          text-slate-900
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-slate-100
        "
      />

    </div>
  );
}
