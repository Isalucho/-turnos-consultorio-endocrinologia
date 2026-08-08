"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
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
