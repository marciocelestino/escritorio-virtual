import { createHmac, timingSafeEqual } from "crypto";

const SECRET =
  process.env.SESSION_SECRET ||
  "dev-only-insecure-secret-change-me";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function sign(payload: string) {
  return createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
}

export function createSessionToken(userId: number) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

// Verifica a assinatura/validade do token e retorna o id nele embutido,
// ou null se o token for inválido/expirado/adulterado.
export function getVerifiedUserId(
  token: string | null | undefined
): number | null {

  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [id, expiresAt, signature] = parts;
  const payload = `${id}.${expiresAt}`;
  const expectedSignature = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  if (Number(expiresAt) < Date.now()) {
    return null;
  }

  return Number(id);
}

export function verifySessionToken(
  token: string | undefined,
  userId: number
) {
  return getVerifiedUserId(token) === userId;
}
