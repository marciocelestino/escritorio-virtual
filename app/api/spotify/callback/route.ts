import { NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/authToken";
import { updateUser } from "@/lib/db";
import { resolveSiteUrl } from "@/lib/email";

// Só o refresh token é gravado (ver o comentário em lib/db.ts sobre
// DbUser.spotifyRefreshToken) — o access token dessa troca inicial é
// descartado; o polling em server.js pega o dele na primeira consulta.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siteUrl = resolveSiteUrl(req);

  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL("/office?spotify=negado", siteUrl)
    );
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const userId = getVerifiedUserId(state);

  if (!userId || !code) {
    return NextResponse.redirect(
      new URL("/office?spotify=erro", siteUrl)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret =
    process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "[spotify] Credenciais não configuradas."
    );

    return NextResponse.redirect(
      new URL(
        "/office?spotify=nao-configurado",
        siteUrl
      )
    );
  }

  const redirectUri = `${siteUrl}/api/spotify/callback`;

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  let tokenResponse: Response;

  try {

    tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

  } catch (error) {

    console.error(
      "[spotify] Falha de rede na troca de token:",
      error
    );

    return NextResponse.redirect(
      new URL("/office?spotify=erro", siteUrl)
    );

  }

  if (!tokenResponse.ok) {

    console.error(
      "[spotify] Troca de código por token falhou:",
      await tokenResponse.text()
    );

    return NextResponse.redirect(
      new URL("/office?spotify=erro", siteUrl)
    );

  }

  const tokenData = await tokenResponse.json();

  if (!tokenData.refresh_token) {

    console.error(
      "[spotify] Resposta sem refresh_token."
    );

    return NextResponse.redirect(
      new URL("/office?spotify=erro", siteUrl)
    );

  }

  updateUser(userId, {
    spotifyRefreshToken: tokenData.refresh_token,
  });

  return NextResponse.redirect(
    new URL("/office?spotify=conectado", siteUrl)
  );
}
