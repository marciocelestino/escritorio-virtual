import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getUserById,
  updateUser,
  emailInUseByAnotherUser,
} from "@/lib/db";
import { getVerifiedUserId } from "@/lib/authToken";

const MAX_AVATAR_LENGTH = 500_000;

export async function PUT(req: Request) {
  const body = await req.json();

  const userId = getVerifiedUserId(body.token);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Sessão inválida." },
      { status: 401 }
    );
  }

  const user = getUserById(userId);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  const fields: Parameters<typeof updateUser>[1] = {};

  if (typeof body.nome === "string" && body.nome.trim()) {
    fields.nome = body.nome.trim();
  }

  if (typeof body.email === "string" && body.email.trim()) {
    const novoEmail = body.email.trim();

    if (
      emailInUseByAnotherUser(novoEmail, userId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Este e-mail já está em uso por outro usuário.",
        },
        { status: 409 }
      );
    }

    fields.email = novoEmail;
  }

  if (typeof body.salaNome === "string") {
    fields.salaNome = body.salaNome.trim() || null;
  }

  if (
    typeof body.avatarTipo === "string" &&
    (body.avatarTipo === "foto" || body.avatarTipo === "emoji")
  ) {

    if (
      typeof body.avatarValor !== "string" ||
      !body.avatarValor
    ) {
      return NextResponse.json(
        { success: false, error: "Avatar inválido." },
        { status: 400 }
      );
    }

    if (body.avatarValor.length > MAX_AVATAR_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: "Imagem do avatar é grande demais.",
        },
        { status: 400 }
      );
    }

    fields.avatarTipo = body.avatarTipo;
    fields.avatarValor = body.avatarValor;
  }

  if (body.avatarTipo === null) {
    fields.avatarTipo = null;
    fields.avatarValor = null;
  }

  if (typeof body.novaSenha === "string" && body.novaSenha) {

    const senhaAtualValida = await bcrypt.compare(
      body.senhaAtual ?? "",
      user.senhaHash
    );

    if (!senhaAtualValida) {
      return NextResponse.json(
        {
          success: false,
          error: "Senha atual incorreta.",
        },
        { status: 400 }
      );
    }

    fields.senhaHash = await bcrypt.hash(
      body.novaSenha,
      10
    );
  }

  const updated = updateUser(userId, fields);

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Falha ao atualizar." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: updated.id,
      nome: updated.nome,
      email: updated.email,
      status: updated.status,
      salaNome: updated.salaNome,
      avatarTipo: updated.avatarTipo,
      avatarValor: updated.avatarValor,
      isAdmin: updated.isAdmin,
    },
  });
}
