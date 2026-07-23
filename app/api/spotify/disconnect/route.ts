import { NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/authToken";
import { updateUser } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();

  const userId = getVerifiedUserId(body.token);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Sessão inválida." },
      { status: 401 }
    );
  }

  updateUser(userId, {
    spotifyRefreshToken: null,
  });

  return NextResponse.json({ success: true });
}
