"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PricesSchema } from "@/lib/validations";

export type PricesState = { message?: string; savedAt?: number } | undefined;

export async function updatePricesAction(_state: PricesState, formData: FormData): Promise<PricesState> {
  await requireAdmin();

  const validated = PricesSchema.safeParse({
    firstConsultPrice: formData.get("firstConsultPrice"),
    followUpPrice: formData.get("followUpPrice"),
  });
  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Datos inválidos." };
  }

  await prisma.clinicSettings.upsert({
    where: { id: 1 },
    update: validated.data,
    create: { id: 1, ...validated.data },
  });

  // Los turnos ya cobrados conservan el monto que se cobró en su momento.
  revalidatePath("/admin");
  revalidatePath("/admin/precios");
  revalidatePath("/turnos");
  return { savedAt: Date.now() };
}
