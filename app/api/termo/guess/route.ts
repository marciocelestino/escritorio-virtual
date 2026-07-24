import { NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/authToken";
import { submitGuess } from "@/lib/termoStore";

export async function POST(req: Request) {
  const body = await req.json();

  const userId = getVerifiedUserId(body.token);

  if (!userId) {
    return NextResponse.json(
      { error: "Sessão inválida." },
      { status: 401 }
    );
  }

  if (typeof body.guess !== "string") {
    return NextResponse.json(
      { error: "Palpite inválido." },
      { status: 400 }
    );
  }

  const outcome = submitGuess(userId, body.guess);

  if (!outcome.ok) {

    const status =
      outcome.error === "already-finished"
        ? 409
        : 400;

    const message =
      outcome.error === "already-finished"
        ? "Você já terminou o Termo de hoje."
        : "Essa palavra não está na lista.";

    return NextResponse.json(
      { error: message },
      { status }
    );

  }

  return NextResponse.json(outcome.view);
}
