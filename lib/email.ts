import { Resend } from "resend";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "onboarding@resend.dev";

let resendClient: Resend | null = null;

// Diagnóstico que não expõe o segredo: só mostra se a variável existe, o
// tamanho e os primeiros caracteres — o suficiente pra saber se o valor
// salvo no Railway é o esperado (ex.: sem o nome da variável duplicado
// dentro do próprio valor, sem espaços/aspas sobrando etc.).
const apiKey = process.env.RESEND_API_KEY;

console.log(
  `[email] RESEND_API_KEY presente? ${Boolean(
    apiKey
  )} — tamanho: ${
    apiKey?.length ?? 0
  } — início: "${
    apiKey?.slice(0, 6) ?? ""
  }..." — RESEND_FROM_EMAIL: "${FROM_EMAIL}"`
);

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
