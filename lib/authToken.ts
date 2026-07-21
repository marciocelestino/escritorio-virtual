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

export function verifySessionToken(
  token: string | undefined,
  userId: number
) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [id, expiresAt, signature] = parts;
  const payload = `${id}.${expiresAt}`;
  const expectedSignature = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false;
  }

  if (Number(expiresAt) < Date.now()) {
    return false;
  }

  return Number(id) === userId;
}
