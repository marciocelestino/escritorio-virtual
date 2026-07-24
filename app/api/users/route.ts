import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";
import {
  getVerifiedUserId,
  getBearerToken,
} from "@/lib/authToken";

// Antes respondia sem checar nada — qualquer um com o link baixava nome,
// e-mail, sala, foto e se é admin de todo mundo (achado "Alto" do
// relatório de segurança de 23/07/2026). Agora exige a mesma sessão
// válida que /api/me já exige — não precisa ser admin, só estar
// logado, já que é assim que o app monta o mapa do escritório pra
// qualquer pessoa da equipe. Token via header Authorization, não query
// string (evita ele ficar gravado em histórico/logs).
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

  const safeUsers = getAllUsers().map((full) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senhaHash, spotifyRefreshToken, ...user } =
      full;

    return {
      ...user,
      spotifyConnected: Boolean(
        spotifyRefreshToken
      ),
    };
  });

  return NextResponse.json(safeUsers);
}
