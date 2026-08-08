"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validations";

export type RegisterState =
  | {
      errors?: Partial<Record<"name" | "email" | "phone" | "dni" | "obraSocial" | "password", string[]>>;
      message?: string;
    }
  | undefined;

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dni: formData.get("dni"),
    obraSocial: (formData.get("obraSocial") as string) || undefined,
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, phone, dni, obraSocial, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Ya existe una cuenta registrada con este email."] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      dni,
      obraSocial,
      passwordHash,
      role: "PACIENTE",
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/turnos" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "La cuenta se creó, pero no pudimos iniciar sesión automáticamente. Iniciá sesión manualmente." };
    }
    throw error;
  }
}
