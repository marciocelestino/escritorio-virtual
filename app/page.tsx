"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

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

    router.push("/office");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[420px] rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <img
            src="/logo.png"
            alt="Internit"
            className="mx-auto mb-4 h-16"
          />

          <h1 className="text-2xl font-bold">
            INTERNIT OFFICE
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Escritório Virtual
          </p>
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
            p-3
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
            p-3
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
      </div>
    </main>
  );
}