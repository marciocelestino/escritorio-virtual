import { NextResponse } from "next/server";
import {
  getVerifiedUserId,
  getBearerToken,
} from "@/lib/authToken";
import { getTodayView } from "@/lib/termoStore";

export async function GET(req: Request) {
  const userId = getVerifiedUserId(
    getBearerToken(req)
  );

  if (!userId) {
    return NextResponse.json(
      { error: "Sessão inválida." },
      { status: 401 }
    );
  }

  return NextResponse.json(
    getTodayView(userId)
  );
}
