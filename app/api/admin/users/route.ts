import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getAllUsers,
  getUserById,
  createUser,
  emailInUseByAnotherUser,
} from "@/lib/db";
import { getVerifiedUserId } from "@/lib/authToken";

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

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get(
    "token"
  );

  const admin = requireAdmin(token);

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Acesso negado." },
      { status: 403 }
    );
  }

  const users = getAllUsers().map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ senhaHash, ...user }) => user
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

  return NextResponse.json({
    success: true,
    user: {
      id: created.id,
      nome: created.nome,
      email: created.email,
    },
  });
}
