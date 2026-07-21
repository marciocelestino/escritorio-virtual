import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import users from "@/data/usuarios.json";
import { createSessionToken } from "@/lib/authToken";

export async function POST(req: Request) {
  const body = await req.json();

  const user = users.find(
    (u) => u.email === body.email
  );

  const senhaValida =
    user &&
    (await bcrypt.compare(
      body.senha ?? "",
      user.senhaHash
    ));

  if (!user || !senhaValida) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
    },
    token: createSessionToken(user.id),
  });
}