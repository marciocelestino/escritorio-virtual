import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";

export async function GET() {
  const safeUsers = getAllUsers().map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ senhaHash, ...user }) => user
  );

  return NextResponse.json(safeUsers);
}
