"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [
    mostrarEsqueciSenha,
    setMostrarEsqueciSenha,
  ] = useState(false);

  const [
    emailRecuperacao,
    setEmailRecuperacao,
  ] = useState("");

  const [
    enviandoRecuperacao,
    setEnviandoRecuperacao,
  ] = useState(false);

  const [
    mensagemRecuperacao,
    setMensagemRecuperacao,
  ] = useState("");

  const login = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    if (!response.ok) {
      alert("Usuário ou senha inválidos");
      return;
    }

    const data = await response.json();

    localStorage.setItem(
      "usuario",
      JSON.stringify(data.user)
    );

    localStorage.setItem(
      "token",
      data.token
    );

    router.push("/office");
  };

  const enviarRecuperacao = async () => {

    setEnviandoRecuperacao(true);
    setMensagemRecuperacao("");

    await fetch("/api/esqueci-senha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailRecuperacao,
      }),
    });

    setEnviandoRecuperacao(false);

    setMensagemRecuperacao(
      "Se esse e-mail estiver cadastrado, uma nova senha foi enviada para ele."
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[420px] rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <Image
            src="/logo.png"
            alt="Internit"
            width={200}
            height={70}
            className="mx-auto mb-4 h-16 w-auto"
          />

          <h1 className="text-2xl font-bold">
            ENTRE, a Casa é Sua!
          </h1>
        </div>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="
            mb-4
            w-full
            rounded-lg
            border
            border-slate-300
            bg-white
            p-3
            text-slate-900
            placeholder:text-slate-400
          "
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
          className="
            mb-6
            w-full
            rounded-lg
            border
            border-slate-300
            bg-white
            p-3
            text-slate-900
            placeholder:text-slate-400
          "
        />

        <button
          onClick={login}
          className="
            w-full
            rounded-lg
            bg-blue-600
            p-3
            text-white
            hover:bg-blue-700
          "
        >
          Entrar
        </button>

        {!mostrarEsqueciSenha && (

          <button
            onClick={() => {
              setMostrarEsqueciSenha(true);
              setMensagemRecuperacao("");
            }}
            className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
          >
            Esqueci minha senha
          </button>

        )}

        {mostrarEsqueciSenha && (

          <div className="mt-4 border-t border-slate-200 pt-4">

            <p className="mb-2 text-sm text-slate-600">
              Informe seu e-mail — se ele estiver
              cadastrado, enviamos uma nova senha
              para você.
            </p>

            <input
              type="email"
              placeholder="Seu e-mail"
              value={emailRecuperacao}
              onChange={(e) =>
                setEmailRecuperacao(
                  e.target.value
                )
              }
              className="
                mb-3
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2
                text-slate-900
                placeholder:text-slate-400
              "
            />

            <div className="flex gap-2">

              <button
                onClick={enviarRecuperacao}
                disabled={
                  enviandoRecuperacao ||
                  !emailRecuperacao
                }
                className="
                  flex-1
                  rounded-lg
                  bg-slate-800
                  p-2
                  text-sm
                  text-white
                  hover:bg-slate-900
                  disabled:opacity-60
                "
              >
                {enviandoRecuperacao
                  ? "Enviando..."
                  : "Enviar nova senha"}
              </button>

              <button
                onClick={() => {
                  setMostrarEsqueciSenha(false);
                  setMensagemRecuperacao("");
                }}
                className="rounded-lg bg-slate-100 p-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>

            </div>

            {mensagemRecuperacao && (
              <p className="mt-3 text-sm text-green-700">
                {mensagemRecuperacao}
              </p>
            )}

          </div>

        )}

      </div>
    </main>
  );
}