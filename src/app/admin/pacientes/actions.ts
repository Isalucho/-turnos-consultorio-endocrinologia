"use server";

import { revalidatePath } from "next/cache";

import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ClinicalNoteSchema } from "@/lib/validations";

export type ClinicalNoteState = { message?: string } | undefined;

export async function addClinicalNoteAction(_state: ClinicalNoteState, formData: FormData): Promise<ClinicalNoteState> {
  await requireAdmin();

  const patientId = formData.get("patientId") as string;

  const validated = ClinicalNoteSchema.safeParse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    bloodPressure: (formData.get("bloodPressure") as string) || undefined,
    diagnosis: (formData.get("diagnosis") as string) || undefined,
    treatment: (formData.get("treatment") as string) || undefined,
    labResults: (formData.get("labResults") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });

  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { date, ...rest } = validated.data;

  await prisma.clinicalNote.create({
    data: {
      patientId,
      date: parseDateOnly(date),
      ...rest,
    },
  });

  revalidatePath(`/admin/pacientes/${patientId}`);
}

export async function deleteClinicalNoteAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const patientId = formData.get("patientId") as string;

  await prisma.clinicalNote.delete({ where: { id } });

  revalidatePath(`/admin/pacientes/${patientId}`);
}
