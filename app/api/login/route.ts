import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";
import { createSessionToken } from "@/lib/authToken";

export async function POST(req: Request) {
  const body = await req.json();

  const user = getUserByEmail(body.email ?? "");

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
      isAdmin: user.isAdmin,
    },
    token: createSessionToken(user.id),
  });
}
