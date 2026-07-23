"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { useMounted } from "@/lib/useMounted";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  const router = useRouter();

  const mounted = useMounted();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {

    const user = getSessionUser();

    if (!user) {
      router.push("/");
      return;
    }

    if (!user.isAdmin) {
      return;
    }

    // Só roda uma vez, na checagem de sessão do cliente ao montar a
    // página — não é um estado que fica sincronizando/recalculando.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllowed(true);

  }, [router]);

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
      <AdminPanel
        onClose={() => router.push("/office")}
      />
    </main>
  );
}
