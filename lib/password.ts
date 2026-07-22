import { randomBytes } from "crypto";

// Gera uma senha aleatória legível (evita caracteres ambíguos como 0/O/1/l).
const ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generateRandomPassword(
  length = 10
) {

  const bytes = randomBytes(length);

  let password = "";

  for (let i = 0; i < length; i++) {
    password +=
      ALPHABET[
        bytes[i] % ALPHABET.length
      ];
  }

  return password;
}
