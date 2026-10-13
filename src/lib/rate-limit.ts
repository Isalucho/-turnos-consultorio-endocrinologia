import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export type RateRule = { key: string; limit: number; windowMs: number };

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Hasheamos el identificador para no guardar emails ni IPs en claro en la tabla de intentos. */
function keyOf(scope: string, value: string) {
  return `${scope}:${createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 24)}`;
}

function ipFromHeaders(source: Headers): string | null {
  const forwarded = source.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || source.get("x-real-ip") || null;
}

export async function getClientIp(): Promise<string | null> {
  return ipFromHeaders(await headers());
}

export function getRequestIp(request: Request | undefined): string | null {
  return request ? ipFromHeaders(request.headers) : null;
}

// Sin IP conocida (ej. desarrollo local) se omite la regla por IP: si no, todos compartirían el mismo contador.
export const loginKeys = (email: string, ip: string | null) => ({
  byEmail: keyOf("login-email", email),
  byIp: ip ? keyOf("login-ip", ip) : null,
});

export function loginRules(email: string, ip: string | null): RateRule[] {
  const keys = loginKeys(email, ip);
  const rules: RateRule[] = [{ key: keys.byEmail, limit: 8, windowMs: 15 * MINUTE }];
  if (keys.byIp) rules.push({ key: keys.byIp, limit: 30, windowMs: 15 * MINUTE });
  return rules;
}

export function forgotPasswordRules(email: string, ip: string | null) {
  return {
    byEmail: { key: keyOf("forgot-email", email), limit: 3, windowMs: HOUR } satisfies RateRule,
    byIp: ip ? ({ key: keyOf("forgot-ip", ip), limit: 10, windowMs: HOUR } satisfies RateRule) : null,
  };
}

export function registerRule(ip: string | null): RateRule | null {
  return ip ? { key: keyOf("register-ip", ip), limit: 10, windowMs: HOUR } : null;
}

export async function isLimited(rules: RateRule[]): Promise<boolean> {
  for (const rule of rules) {
    const hits = await prisma.rateLimitHit.count({
      where: { key: rule.key, createdAt: { gte: new Date(Date.now() - rule.windowMs) } },
    });
    if (hits >= rule.limit) return true;
  }
  return false;
}

export async function recordHit(keys: (string | null)[]) {
  const valid = keys.filter((key): key is string => !!key);
  if (valid.length === 0) return;
  await prisma.rateLimitHit.createMany({ data: valid.map((key) => ({ key })) });

  // Limpieza ocasional de intentos viejos para que la tabla no crezca.
  if (Math.random() < 0.05) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * HOUR) } } });
  }
}

export async function clearHits(key: string) {
  await prisma.rateLimitHit.deleteMany({ where: { key } });
}
