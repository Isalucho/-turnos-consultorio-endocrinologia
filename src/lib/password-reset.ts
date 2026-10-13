import "server-only";
import { randomBytes, createHash } from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hora

export function generatePasswordResetToken() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashPasswordResetToken(token) };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
