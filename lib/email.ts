import { Resend } from "resend";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "onboarding@resend.dev";

let resendClient: Resend | null = null;

function getResendClient() {

  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(
      process.env.RESEND_API_KEY
    );
  }

  return resendClient;
}

// req.url reflete o endereço interno do servidor (ex.: 0.0.0.0:8080) atrás
// de um proxy como o do Railway, não o domínio público — por isso os
// links nos e-mails saíam errados. Os headers x-forwarded-* é que trazem
// o host/protocolo de verdade que o navegador usou.
export function resolveSiteUrl(
  req: Request
): string {

  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }

  const forwardedHost = req.headers.get(
    "x-forwarded-host"
  );

  const forwardedProto =
    req.headers.get("x-forwarded-proto") ||
    "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(req.url).origin;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {

  const client = getResendClient();

  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY não definido — e-mail "${subject}" para ${to} não foi enviado.`
    );
    return;
  }

  try {

    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

  } catch (error) {

    console.error(
      "[email] Falha ao enviar e-mail:",
      error
    );

  }
}
