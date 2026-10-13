"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAvailableSlots } from "@/lib/availability";
import { formatDateISO, formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { sendAppointmentConfirmedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { AdminBookAppointmentSchema, AdminCreatePatientSchema, ClinicalNoteSchema } from "@/lib/validations";

export type CreatePatientState =
  | {
      errors?: Partial<Record<"name" | "dni" | "phone" | "email", string[]>>;
      existingPatientId?: string;
    }
  | undefined;

export async function createPatientAction(_state: CreatePatientState, formData: FormData): Promise<CreatePatientState> {
  await requireAdmin();

  const validated = AdminCreatePatientSchema.safeParse({
    name: formData.get("name"),
    dni: formData.get("dni"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    obraSocial: (formData.get("obraSocial") as string) || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, dni, phone, email, obraSocial } = validated.data;

  const sameDni = await prisma.user.findFirst({ where: { dni, role: "PACIENTE" } });
  if (sameDni) {
    return {
      errors: { dni: [`Ya existe un paciente con este DNI: ${sameDni.name}.`] },
      existingPatientId: sameDni.id,
    };
  }

  if (email) {
    const sameEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (sameEmail) {
      return { errors: { email: ["Ya existe un paciente con este email."] }, existingPatientId: sameEmail.id };
    }
  }

  const patient = await prisma.user.create({
    data: { name, dni, phone, email, obraSocial, role: "PACIENTE" },
  });

  revalidatePath("/admin/pacientes");
  redirect(`/admin/pacientes/${patient.id}?nuevo=1`);
}

export type AdminBookState = { message?: string } | undefined;

export async function adminBookAppointmentAction(_state: AdminBookState, formData: FormData): Promise<AdminBookState> {
  await requireAdmin();

  const validated = AdminBookAppointmentSchema.safeParse({
    patientId: formData.get("patientId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    reason: (formData.get("reason") as string) || undefined,
  });

  if (!validated.success) {
    return { message: "Elegí un horario válido para continuar." };
  }

  const { patientId, date: dateStr, startTime, reason } = validated.data;
  const date = parseDateOnly(dateStr);

  if (Number.isNaN(date.getTime()) || date.getTime() < todayDateOnly().getTime()) {
    return { message: "No se pueden dar turnos en fechas pasadas." };
  }

  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient || patient.role !== "PACIENTE") {
    return { message: "No se encontró al paciente." };
  }

  const slots = await getAvailableSlots(date);
  const slot = slots.find((s) => s.startTime === startTime);
  if (!slot) {
    return { message: "Ese horario ya no está disponible. Elegí otro." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const clash = await tx.appointment.findFirst({
        where: { date, startTime: slot.startTime, status: "CONFIRMED" },
      });
      if (clash) throw new Error("SLOT_TAKEN");

      await tx.appointment.create({
        data: { patientId, date, startTime: slot.startTime, endTime: slot.endTime, reason },
      });
    });
  } catch (error) {
    const isUniqueViolation = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (isUniqueViolation || (error instanceof Error && error.message === "SLOT_TAKEN")) {
      return { message: "Ese horario se acaba de ocupar. Elegí otro." };
    }
    throw error;
  }

  if (patient.email && formData.get("notify") === "on") {
    await sendAppointmentConfirmedEmail({
      to: patient.email,
      patientName: patient.name,
      dateLabel: formatDateLong(date),
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/pacientes/${patientId}`);
  redirect(`/admin/pacientes/${patientId}?date=${dateStr}&turno=ok&hora=${slot.startTime}`);
}

export type ClinicalNoteState = { message?: string; savedAt?: number } | undefined;

function parseClinicalNoteForm(formData: FormData) {
  return ClinicalNoteSchema.safeParse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    bloodPressure: (formData.get("bloodPressure") as string) || undefined,
    diagnosis: (formData.get("diagnosis") as string) || undefined,
    treatment: (formData.get("treatment") as string) || undefined,
    labResults: (formData.get("labResults") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });
}

export async function addClinicalNoteAction(_state: ClinicalNoteState, formData: FormData): Promise<ClinicalNoteState> {
  await requireAdmin();

  const patientId = formData.get("patientId") as string;

  const validated = parseClinicalNoteForm(formData);
  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const patient = await prisma.user.findUnique({ where: { id: patientId }, select: { role: true } });
  if (patient?.role !== "PACIENTE") {
    return { message: "No se encontró al paciente." };
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
  return { savedAt: Date.now() };
}

export async function updateClinicalNoteAction(_state: ClinicalNoteState, formData: FormData): Promise<ClinicalNoteState> {
  await requireAdmin();

  const noteId = formData.get("noteId") as string;
  const patientId = formData.get("patientId") as string;

  const validated = parseClinicalNoteForm(formData);
  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const note = await prisma.clinicalNote.findUnique({ where: { id: noteId } });
  if (!note || note.patientId !== patientId || note.deletedAt) {
    return { message: "No se encontró el registro. Puede que ya haya sido eliminado." };
  }

  const { date, ...rest } = validated.data;

  // Se guarda una copia de la versión anterior y se actualiza en una sola transacción.
  await prisma.$transaction([
    prisma.clinicalNoteRevision.create({
      data: {
        noteId,
        snapshot: {
          date: formatDateISO(note.date),
          weightKg: note.weightKg,
          bloodPressure: note.bloodPressure,
          diagnosis: note.diagnosis,
          treatment: note.treatment,
          labResults: note.labResults,
          notes: note.notes,
          savedAt: note.updatedAt.toISOString(),
        },
      },
    }),
    prisma.clinicalNote.update({
      where: { id: noteId },
      data: {
        date: parseDateOnly(date),
        weightKg: rest.weightKg ?? null,
        bloodPressure: rest.bloodPressure ?? null,
        diagnosis: rest.diagnosis ?? null,
        treatment: rest.treatment ?? null,
        labResults: rest.labResults ?? null,
        notes: rest.notes ?? null,
      },
    }),
  ]);

  revalidatePath(`/admin/pacientes/${patientId}`);
  redirect(`/admin/pacientes/${patientId}?editado=1`);
}

export async function deleteClinicalNoteAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const patientId = formData.get("patientId") as string;

  await prisma.clinicalNote.updateMany({
    where: { id, patientId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/admin/pacientes/${patientId}`);
}

export async function restoreClinicalNoteAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const patientId = formData.get("patientId") as string;

  await prisma.clinicalNote.updateMany({
    where: { id, patientId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });

  revalidatePath(`/admin/pacientes/${patientId}`);
}
