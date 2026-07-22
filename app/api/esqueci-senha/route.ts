import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, updateUser } from "@/lib/db";
import { generateRandomPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();

  const email =
    typeof body.email === "string"
      ? body.email.trim()
      : "";

  // Sempre responde com a mesma mensagem genérica, exista ou não o
  // e-mail — assim ninguém consegue usar essa tela para descobrir quais
  // e-mails estão cadastrados no sistema.
  if (email) {

    const user = getUserByEmail(email);

    if (user) {

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
