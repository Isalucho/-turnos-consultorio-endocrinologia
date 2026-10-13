"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, isLimited, recordHit, registerRule } from "@/lib/rate-limit";
import { RegisterSchema } from "@/lib/validations";

export type RegisterState =
  | {
      errors?: Partial<
        Record<"name" | "email" | "phone" | "dni" | "obraSocial" | "password" | "privacyAccepted", string[]>
      >;
      message?: string;
    }
  | undefined;

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const limit = registerRule(await getClientIp());
  if (limit) {
    if (await isLimited([limit])) {
      return { message: "Demasiados intentos de registro desde esta conexión. Probá de nuevo en una hora." };
    }
    await recordHit([limit.key]);
  }

  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dni: formData.get("dni"),
    obraSocial: (formData.get("obraSocial") as string) || undefined,
    password: formData.get("password"),
    privacyAccepted: formData.get("privacyAccepted"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, phone, dni, obraSocial, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const message = existing.passwordHash
      ? "Ya existe una cuenta registrada con este email."
      : "Ya tenés un perfil en el consultorio con este email. Activá tu cuenta desde \"¿Olvidaste tu contraseña?\" en el inicio de sesión.";
    return { errors: { email: [message] } };
  }

  const sameDni = await prisma.user.findFirst({ where: { dni, role: "PACIENTE" } });
  if (sameDni) {
    return {
      errors: {
        dni: ["Ya hay un paciente cargado con este DNI. Si ya te atendés en el consultorio, comunicate con nosotros para activar tu cuenta."],
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        dni,
        obraSocial,
        passwordHash,
        role: "PACIENTE",
        privacyAcceptedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { message: "Ya existe una cuenta con esos datos (email o DNI). Probá iniciar sesión." };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/turnos" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "La cuenta se creó, pero no pudimos iniciar sesión automáticamente. Iniciá sesión manualmente." };
    }
    throw error;
  }
}
