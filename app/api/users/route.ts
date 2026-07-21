import { NextResponse } from "next/server";
import users from "@/data/usuarios.json";

export async function GET() {
  const safeUsers = users.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ senhaHash, ...user }) => user
  );

  return NextResponse.json(safeUsers);
}
