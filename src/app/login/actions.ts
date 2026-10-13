"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, isLimited, loginRules } from "@/lib/rate-limit";
import { LoginSchema } from "@/lib/validations";

export type LoginState = { message?: string } | undefined;

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { message: "Ingresá un email y una contraseña válidos." };
  }

  const { email, password } = validated.data;

  // Solo para mostrar un mensaje claro; el bloqueo real se aplica dentro de `authorize` (src/auth.ts).
  if (await isLimited(loginRules(email, await getClientIp()))) {
    return {
      message: "Demasiados intentos fallidos. Esperá unos 15 minutos o usá \"¿Olvidaste tu contraseña?\".",
    };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email o contraseña incorrectos." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  redirect(user?.role === "ADMIN" ? "/admin" : "/turnos");
}
