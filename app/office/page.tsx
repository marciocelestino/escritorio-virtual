"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserCard from "@/components/UserCard";
import StatusSelector from "@/components/StatusSelector";
import { getSessionUser } from "@/lib/session";

import usersData from "@/data/usuarios.json";

type UserItem = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  status: "Disponivel" | "Ausente" | "Reuniao";
  online?: boolean;
};

export default function OfficePage() {
  const router = useRouter();

  const [currentRoom, setCurrentRoom] = useState("Recepção");
  const [status, setStatus] = useState<"Disponivel" | "Ausente" | "Reuniao">(
    "Disponivel"
  );
  const [mounted, setMounted] = useState(false);

  const allUsers = usersData as UserItem[];

  const onlineUsers = useMemo(() => {
    return allUsers.filter((user) => user.online !== false);
  }, []);

  useEffect(() => {
    setMounted(true);

    const user = getSessionUser();

    if (!user) {
      router.push("/");
      return;
    }

    const savedStatus = localStorage.getItem("status");
    if (savedStatus === "Disponivel" || savedStatus === "Ausente" || savedStatus === "Reuniao") {
      setStatus(savedStatus);
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("status", status);
  }, [status, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="flex h-screen flex-col bg-slate-100">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar onRoomChange={setCurrentRoom} />

        <section className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sala Atual</h2>
              <p className="mt-1 text-lg text-slate-600">{currentRoom}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Meu status</span>
              <StatusSelector status={status} setStatus={setStatus} />
            </div>
          </div>

          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">{currentRoom}</h3>
            <p className="mt-2 text-slate-600">
              Conteúdo da sala será exibido aqui na próxima sprint.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900">Área da sala</h4>
              <p className="mt-2 text-sm text-slate-600">
                Aqui depois entraremos com vídeo, microfone e presença em tempo real.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900">Usuários online</h4>
              <p className="mt-2 text-sm text-slate-600">
                {onlineUsers.length} usuários cadastrados como ativos.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h4 className="font-semibold text-slate-900">Próxima etapa</h4>
              <p className="mt-2 text-sm text-slate-600">
                Depois vamos adicionar cutucada, áudio e webcam.
              </p>
            </div>
          </div>
        </section>

        <aside className="w-80 overflow-y-auto border-l bg-white">
          <div className="border-b p-4">
            <h2 className="font-bold text-slate-900">Usuários</h2>
          </div>

          {onlineUsers.map((user) => (
            <UserCard
              key={user.id}
              nome={user.nome}
              status={user.status}
            />
          ))}
        </aside>
      </div>
    </main>
  );
}