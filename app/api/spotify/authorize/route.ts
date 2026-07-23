import { NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/authToken";
import { resolveSiteUrl } from "@/lib/email";

// Só o que é preciso pra ler "tocando agora" — nada de controlar
// playback (pular, pausar etc.), então nada de escopos de escrita.
const SPOTIFY_SCOPES =
  "user-read-currently-playing user-read-playback-state";

// Clicar em "Conectar Spotify" navega direto pra cá (não é um fetch),
// então a sessão vem como query param — o próprio token de sessão serve
// de "state" do OAuth (assinado, com validade), sem precisar guardar
// nada no servidor entre o redirect de ida e o de volta.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const siteUrl = resolveSiteUrl(req);

  const userId = getVerifiedUserId(token);

  if (!userId) {
    return NextResponse.redirect(
      new URL("/office?spotify=erro", siteUrl)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    console.error(
      "[spotify] SPOTIFY_CLIENT_ID não configurado."
    );

    return NextResponse.redirect(
      new URL(
        "/office?spotify=nao-configurado",
        siteUrl
      )
    );
  }

  const redirectUri = `${siteUrl}/api/spotify/callback`;

  const authorizeUrl = new URL(
    "https://accounts.spotify.com/authorize"
  );

  authorizeUrl.searchParams.set(
    "client_id",
    clientId
  );
  authorizeUrl.searchParams.set(
    "response_type",
    "code"
  );
  authorizeUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );
  authorizeUrl.searchParams.set(
    "scope",
    SPOTIFY_SCOPES
  );
  authorizeUrl.searchParams.set(
    "state",
    token as string
  );

  return NextResponse.redirect(authorizeUrl);
}
