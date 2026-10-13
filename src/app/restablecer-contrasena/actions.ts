"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { ResetPasswordSchema } from "@/lib/validations";

export type ResetPasswordState =
  | { errors?: Partial<Record<"password" | "confirmPassword", string[]>>; message?: string }
  | undefined;

export async function resetPasswordAction(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const validated = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { token, password } = validated.data;
  const tokenHash = hashPasswordResetToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { message: "Este link venció o ya fue usado. Pedí uno nuevo." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/login?restablecida=1");
}
