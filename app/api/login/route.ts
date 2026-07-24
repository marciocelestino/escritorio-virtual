import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";
import { createSessionToken } from "@/lib/authToken";

// Sem limite de tentativas, dava pra tentar senha atrás de senha pro
// e-mail de alguém sem trava nenhuma (achado "Médio" do relatório de
// segurança de 23/07/2026) — o bcrypt já deixa cada tentativa um pouco
// lenta, mas não existia uma pausa de verdade depois de várias erradas
// seguidas. Guarda só em memória (processo único) — reinicia o
// servidor, reinicia a contagem.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const failedAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

export async function POST(req: Request) {
  const body = await req.json();

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  const record = failedAttempts.get(email);
  const now = Date.now();

  if (record && record.lockedUntil > now) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Muitas tentativas seguidas. Tente novamente em alguns minutos.",
      },
      { status: 429 }
    );
  }

  const user = getUserByEmail(email);

  const senhaValida =
    user &&
    (await bcrypt.compare(
      body.senha ?? "",
      user.senhaHash
    ));

  if (!user || !senhaValida) {

    const attempts =
      (record?.count ?? 0) + 1;

    failedAttempts.set(email, {
      count: attempts,
      lockedUntil:
        attempts >= MAX_ATTEMPTS
          ? now + LOCKOUT_MS
          : 0,
    });

    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  failedAttempts.delete(email);

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      isAdmin: user.isAdmin,
    },
    token: createSessionToken(user.id),
  });
}
