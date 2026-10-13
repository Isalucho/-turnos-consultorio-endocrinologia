"use server";

import { headers } from "next/headers";

import { generatePasswordResetToken, PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordRules, getClientIp, isLimited, recordHit } from "@/lib/rate-limit";
import { ForgotPasswordSchema } from "@/lib/validations";

export type ForgotPasswordState = { sent?: boolean; message?: string } | undefined;

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestPasswordResetAction(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const validated = ForgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!validated.success) {
    return { message: "Ingresá un email válido." };
  }

  const { email } = validated.data;

  const rules = forgotPasswordRules(email, await getClientIp());
  if (rules.byIp && (await isLimited([rules.byIp]))) {
    return { message: "Demasiados intentos. Probá de nuevo en un rato." };
  }
  const emailLimited = await isLimited([rules.byEmail]);
  await recordHit([rules.byEmail.key, rules.byIp?.key ?? null]);
  // Si ese email ya pidió varios links, respondemos igual que siempre pero no mandamos otro mail
  // (evita que alguien llene la casilla de una persona y no revela si la cuenta existe).
  if (emailLimited) return { sent: true };

  // Siempre devolvemos el mismo mensaje exista o no la cuenta, para no revelar
  // qué emails están registrados.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { token, tokenHash } = generatePasswordResetToken();

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    const baseUrl = await getBaseUrl();
    await sendPasswordResetEmail({
      to: email,
      patientName: user.name ?? "Paciente",
      resetUrl: `${baseUrl}/restablecer-contrasena?token=${token}`,
    });
  }

  return { sent: true };
}
