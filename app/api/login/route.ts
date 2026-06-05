import { NextResponse } from "next/server";
import users from "@/data/usuarios.json";

export async function POST(req: Request) {
  const body = await req.json();

  const user = users.find(
    (u) =>
      u.email === body.email &&
      u.senha === body.senha
  );

  if (!user) {
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
  });
}