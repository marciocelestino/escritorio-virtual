import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  countAdmins,
  emailInUseByAnotherUser,
} from "@/lib/db";
import {
  getVerifiedUserId,
  getBearerToken,
} from "@/lib/authToken";
import { sendEmail, resolveSiteUrl } from "@/lib/email";

function requireAdmin(token: unknown) {

  const userId = getVerifiedUserId(
    typeof token === "string" ? token : null
  );

  if (!userId) {
    return null;
  }

  const user = getUserById(userId);

  if (!user || !user.isAdmin) {
    return null;
  }

  return user;
}

// Token via header Authorization, não query string (evita ele ficar
// gravado em histórico/logs) — os outros métodos abaixo (POST/PATCH/
// DELETE) já mandavam o token no corpo da requisição, sem esse problema.
export async function GET(req: Request) {
  const admin = requireAdmin(
    getBearerToken(req)
  );

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Acesso negado." },
      { status: 403 }
    );
  }

  const users = getAllUsers().map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ senhaHash, spotifyRefreshToken, ...user }) =>
      user
  );

  return NextResponse.json({ success: true, users });
}

export async function POST(req: Request) {
  const body = await req.json();

  const admin = requireAdmin(body.token);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Acesso negado." },
      { status: 403 }
    );
  }

  const { nome, email, senha } = body;

  if (!nome || !email || !senha) {
    return NextResponse.json(
      {
        success: false,
        error: "Preencha nome, e-mail e senha.",
      },
      { status: 400 }
    );
  }

  if (emailInUseByAnotherUser(email, -1)) {
    return NextResponse.json(
      {
        success: false,
        error: "Já existe um usuário com esse e-mail.",
      },
      { status: 409 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const created = createUser({
    nome,
    email,
    senhaHash,
  });

  const siteUrl = resolveSiteUrl(req);

  await sendEmail({
    to: created.email,
    subject: "Seu acesso ao Internit Office",
    html: `
      <p>Olá, ${created.nome}!</p>
      <p>Sua conta no Internit Office foi criada. Dados de acesso:</p>
      <p>
        Link: <a href="${siteUrl}">${siteUrl}</a><br/>
        E-mail: ${created.email}<br/>
        Senha: ${senha}
      </p>
      <p>Recomendamos trocar essa senha assim que entrar, em "Meus Dados".</p>
    `,
  });

  return NextResponse.json({
    success: true,
    user: {
      id: created.id,
      nome: created.nome,
      email: created.email,
    },
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  const admin = requireAdmin(body.token);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Acesso negado." },
      { status: 403 }
    );
  }

  const targetId = Number(body.userId);
  const target = getUserById(targetId);

  if (!target) {
    return NextResponse.json(
      { success: false, error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  const wantsAdmin = Boolean(body.isAdmin);

  if (
    target.isAdmin &&
    !wantsAdmin &&
    targetId === admin.id
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Você não pode remover sua própria permissão de administrador.",
      },
      { status: 400 }
    );
  }

  if (
    target.isAdmin &&
    !wantsAdmin &&
    countAdmins() <= 1
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Precisa existir pelo menos um administrador.",
      },
      { status: 400 }
    );
  }

  const updated = updateUser(targetId, {
    isAdmin: wantsAdmin,
  });

  return NextResponse.json({
    success: true,
    user: updated
      ? {
          id: updated.id,
          nome: updated.nome,
          email: updated.email,
          isAdmin: updated.isAdmin,
        }
      : null,
  });
}

export async function DELETE(req: Request) {
  const body = await req.json();

  const admin = requireAdmin(body.token);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Acesso negado." },
      { status: 403 }
    );
  }

  const targetId = Number(body.userId);
  const target = getUserById(targetId);

  if (!target) {
    return NextResponse.json(
      { success: false, error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  if (targetId === admin.id) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Você não pode excluir sua própria conta.",
      },
      { status: 400 }
    );
  }

  if (
    target.isAdmin &&
    countAdmins() <= 1
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Precisa existir pelo menos um administrador.",
      },
      { status: 400 }
    );
  }

  deleteUser(targetId);

  return NextResponse.json({
    success: true,
  });
}
