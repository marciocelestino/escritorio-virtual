"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSessionUser,
  getSessionToken,
} from "@/lib/session";

type AdminUser = {
  id: number;
  nome: string;
  email: string;
  isAdmin: boolean;
};

export default function AdminPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function loadUsers() {

    const token = getSessionToken();

    fetch(
      `/api/admin/users?token=${encodeURIComponent(
        token ?? ""
      )}`
    )
      .then((res) => res.json())
      .then((data) => {

        if (!data.success) {
          setAllowed(false);
          return;
        }

        setUsers(data.users);

      });
  }

  useEffect(() => {

    setMounted(true);

    const user = getSessionUser();

    if (!user) {
      router.push("/");
      return;
    }

    if (!user.isAdmin) {
      setAllowed(false);
      return;
    }

    setAllowed(true);

    loadUsers();

  }, [router]);

  async function handleCreate(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const response = await fetch(
      "/api/admin/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: getSessionToken(),
          nome,
          email,
          senha,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      setErro(
        data.error || "Não foi possível criar o usuário."
      );
      return;
    }

    setSucesso(
      `Usuário "${data.user.nome}" criado com sucesso.`
    );

    setNome("");
    setEmail("");
    setSenha("");

    loadUsers();
  }

  if (!mounted) {
    return null;
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-slate-900">
            Acesso negado
          </h1>

          <p className="mt-2 text-slate-600">
            Esta página é só para administradores.
          </p>

          <Link
            href="/office"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Voltar para o escritório
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">
            Administração
          </h1>

          <Link
            href="/office"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Voltar para o escritório
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Criar novo usuário
          </h2>

          <form
            onSubmit={handleCreate}
            className="grid gap-3 md:grid-cols-3"
          >
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="rounded-lg border p-2"
            />

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border p-2"
            />

            <input
              type="text"
              placeholder="Senha inicial"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="rounded-lg border p-2"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white md:col-span-3"
            >
              Criar usuário
            </button>
          </form>

          {erro && (
            <p className="mt-3 text-sm text-red-600">
              {erro}
            </p>
          )}

          {sucesso && (
            <p className="mt-3 text-sm text-green-600">
              {sucesso}
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500">
            A sala pessoal do usuário (&quot;Espaço Nome&quot;) aparece
            automaticamente assim que ele for criado.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Usuários cadastrados ({users.length})
          </h2>

          <div className="divide-y">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {user.nome}
                  </div>

                  <div className="text-sm text-slate-500">
                    {user.email}
                  </div>
                </div>

                {user.isAdmin && (
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
