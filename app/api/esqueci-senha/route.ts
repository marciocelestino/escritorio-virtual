import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, updateUser } from "@/lib/db";
import { generateRandomPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";

// Sem isso, dava pra chamar essa rota repetidamente pro e-mail de um
// colega — cada chamada troca a senha dele e manda uma nova por e-mail,
// então virava um jeito fácil de incomodar alguém (a senha antiga para
// de funcionar a cada pedido), mesmo sem vazar nada (achado "Alto" do
// relatório de segurança de 23/07/2026). Guarda só em memória (processo
// único, sem estado compartilhado) — reinicia o servidor, reinicia a
// contagem, o que é aceitável pra esse tipo de trava simples.
const COOLDOWN_MS = 2 * 60 * 1000;
const lastRequestAt = new Map<string, number>();

export async function POST(req: Request) {
  const body = await req.json();

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  // Sempre responde com a mesma mensagem genérica, exista ou não o
  // e-mail (ou esteja em cooldown) — assim ninguém consegue usar essa
  // tela pra descobrir quais e-mails estão cadastrados no sistema.
  if (email) {

    const now = Date.now();
    const last = lastRequestAt.get(email);

    const emCooldown =
      last !== undefined &&
      now - last < COOLDOWN_MS;

    const user = emCooldown
      ? null
      : getUserByEmail(email);

    if (user) {

      lastRequestAt.set(email, now);

      const novaSenha =
        generateRandomPassword();

      const senhaHash = await bcrypt.hash(
        novaSenha,
        10
      );

      updateUser(user.id, { senhaHash });

      await sendEmail({
        to: user.email,
        subject:
          "Sua nova senha — Internit Office",
        html: `
          <p>Olá, ${user.nome}!</p>
          <p>Você pediu para redefinir sua senha do Internit Office. Sua nova senha de acesso é:</p>
          <p style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">${novaSenha}</p>
          <p>Assim que entrar, recomendamos trocar essa senha em "Meus Dados".</p>
          <p>Se você não pediu essa redefinição, avise um administrador.</p>
        `,
      });

    }

  }

  return NextResponse.json({
    success: true,
  });
}
