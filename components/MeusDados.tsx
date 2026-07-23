"use client";

import { useEffect, useState } from "react";
import {
  getSessionUser,
  getSessionToken,
} from "@/lib/session";

type Props = {
  onClose: () => void;
};

const AVATAR_EMOJIS = [
  "😀", "😎", "🤠", "🥸", "🧑‍💻", "🦊",
  "🐼", "🐨", "🦁", "🐵", "🦉", "🐙",
];

function resizeImageToDataUrl(
  file: File
): Promise<string> {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onerror = () =>
      reject(reader.error);

    reader.onload = () => {

      const img = new Image();

      img.onerror = () =>
        reject(new Error("Imagem inválida."));

      img.onload = () => {

        const size = 160;
        const canvas = document.createElement(
          "canvas"
        );

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(
            new Error(
              "Não foi possível processar a imagem."
            )
          );
          return;
        }

        const scale = Math.max(
          size / img.width,
          size / img.height
        );

        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;

        ctx.drawImage(
          img,
          (size - drawWidth) / 2,
          (size - drawHeight) / 2,
          drawWidth,
          drawHeight
        );

        resolve(
          canvas.toDataURL("image/jpeg", 0.7)
        );

      };

      img.src = reader.result as string;

    };

    reader.readAsDataURL(file);

  });
}

export default function MeusDados({
  onClose,
}: Props) {

  const sessionUser = getSessionUser();

  const [nome, setNome] = useState(
    sessionUser?.nome ?? ""
  );

  const [email, setEmail] = useState(
    sessionUser?.email ?? ""
  );

  const [salaNome, setSalaNome] = useState(
    sessionUser?.salaNome ?? ""
  );

  const [avatarTipo, setAvatarTipo] = useState<
    "emoji" | "foto" | null
  >(sessionUser?.avatarTipo ?? null);

  const [avatarValor, setAvatarValor] = useState<
    string | null
  >(sessionUser?.avatarValor ?? null);

  const [senhaAtual, setSenhaAtual] =
    useState("");

  const [novaSenha, setNovaSenha] =
    useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] =
    useState(false);

  // null = ainda não sabemos (carregando) — busca fresca em vez de
  // confiar no localStorage, já que conectar volta de um redirect pro
  // OAuth do Spotify, não passa pelo formulário/PUT abaixo.
  const [
    spotifyConnected,
    setSpotifyConnected,
  ] = useState<boolean | null>(null);

  const [desconectandoSpotify, setDesconectandoSpotify] =
    useState(false);

  useEffect(() => {

    const token = getSessionToken();

    if (!token) {
      return;
    }

    fetch(
      `/api/me?token=${encodeURIComponent(token)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSpotifyConnected(
            Boolean(data.user.spotifyConnected)
          );
        }
      })
      .catch(() => {});

  }, []);

  function conectarSpotify() {

    const token = getSessionToken();

    if (!token) {
      return;
    }

    window.location.href = `/api/spotify/authorize?token=${encodeURIComponent(
      token
    )}`;

  }

  async function desconectarSpotify() {

    const token = getSessionToken();

    if (!token) {
      return;
    }

    setDesconectandoSpotify(true);

    try {

      await fetch("/api/spotify/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      setSpotifyConnected(false);

    } finally {
      setDesconectandoSpotify(false);
    }

  }

  async function handleFotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {

      const dataUrl =
        await resizeImageToDataUrl(file);

      setAvatarTipo("foto");
      setAvatarValor(dataUrl);

    } catch {

      setErro(
        "Não foi possível processar essa imagem."
      );

    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErro("");

    if (
      novaSenha &&
      novaSenha !== confirmarSenha
    ) {
      setErro(
        "A confirmação de senha não confere."
      );
      return;
    }

    setSalvando(true);

    const body: Record<string, unknown> = {
      token: getSessionToken(),
      nome,
      email,
      salaNome,
    };

    if (avatarTipo && avatarValor) {
      body.avatarTipo = avatarTipo;
      body.avatarValor = avatarValor;
    }

    if (novaSenha) {
      body.senhaAtual = senhaAtual;
      body.novaSenha = novaSenha;
    }

    const response = await fetch("/api/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    setSalvando(false);

    if (!data.success) {
      setErro(
        data.error ||
          "Não foi possível salvar as alterações."
      );
      return;
    }

    localStorage.setItem(
      "usuario",
      JSON.stringify(data.user)
    );

    onClose();

    window.location.reload();
  }

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
          max-h-[90vh]
          w-full
          max-w-lg
          overflow-y-auto
          rounded-2xl
          bg-white
          p-6
          shadow-xl
        "
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Meus Dados
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome da minha sala
            </label>

            <input
              type="text"
              value={salaNome}
              onChange={(e) =>
                setSalaNome(e.target.value)
              }
              placeholder={`Espaço ${nome}`}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Avatar
            </label>

            <div className="mb-3 flex items-center gap-3">
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  bg-blue-600
                  text-2xl
                  text-white
                "
              >
                {avatarTipo === "foto" &&
                avatarValor ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarValor}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : avatarTipo === "emoji" &&
                  avatarValor ? (
                  avatarValor
                ) : (
                  nome
                    .split(" ")
                    .slice(0, 2)
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                )}
              </div>

              {avatarTipo && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarTipo(null);
                    setAvatarValor(null);
                  }}
                  className="text-sm text-slate-500 hover:underline"
                >
                  Remover avatar
                </button>
              )}
            </div>

            <label className="mb-2 block text-sm text-slate-600">
              Enviar uma foto
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="mb-3 block w-full text-sm text-slate-700"
            />

            <label className="mb-2 block text-sm text-slate-600">
              Ou escolher um avatar pronto
            </label>

            <div className="flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setAvatarTipo("emoji");
                    setAvatarValor(emoji);
                  }}
                  className={`
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    border
                    text-xl
                    ${
                      avatarTipo === "emoji" &&
                      avatarValor === emoji
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200"
                    }
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-300 p-3">
            <div className="mb-2 text-sm font-medium text-slate-700">
              🎵 Spotify
            </div>

            <p className="mb-3 text-xs text-slate-500">
              Conecte pra mostrar, no seu card,
              a música que estiver tocando na
              sua conta.
            </p>

            {spotifyConnected === null ? (

              <p className="text-xs text-slate-400">
                Verificando...
              </p>

            ) : spotifyConnected ? (

              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">
                  ✅ Conectado
                </span>

                <button
                  type="button"
                  onClick={desconectarSpotify}
                  disabled={
                    desconectandoSpotify
                  }
                  className="text-sm text-red-600 hover:underline disabled:opacity-60"
                >
                  {desconectandoSpotify
                    ? "Desconectando..."
                    : "Desconectar"}
                </button>
              </div>

            ) : (

              <button
                type="button"
                onClick={conectarSpotify}
                className="rounded-lg bg-[#1DB954] px-3 py-2 text-sm font-medium text-white hover:brightness-95"
              >
                Conectar Spotify
              </button>

            )}
          </div>

          <details className="rounded-lg border border-slate-300 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Trocar senha
            </summary>

            <div className="mt-3 space-y-3">
              <input
                type="password"
                placeholder="Senha atual"
                value={senhaAtual}
                onChange={(e) =>
                  setSenhaAtual(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400"
              />

              <input
                type="password"
                placeholder="Nova senha"
                value={novaSenha}
                onChange={(e) =>
                  setNovaSenha(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400"
              />

              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmarSenha}
                onChange={(e) =>
                  setConfirmarSenha(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </details>

          {erro && (
            <p className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-4 py-2 text-slate-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
