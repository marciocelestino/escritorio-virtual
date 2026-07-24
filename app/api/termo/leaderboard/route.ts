import { NextResponse } from "next/server";
import {
  getVerifiedUserId,
  getBearerToken,
} from "@/lib/authToken";
import { getTodayLeaderboard } from "@/lib/termoStore";
import { getAllUsers } from "@/lib/db";

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

  const users = getAllUsers();

  const entries = getTodayLeaderboard().map(
    (entry) => ({
      ...entry,
      nome:
        users.find(
          (user) => user.id === entry.userId
        )?.nome ?? "Alguém",
    })
  );

  return NextResponse.json({ entries });
}
