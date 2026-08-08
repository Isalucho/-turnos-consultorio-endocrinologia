"use server";

import { revalidatePath } from "next/cache";

import { formatDateLong } from "@/lib/dates";
import { sendAppointmentCancelledEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { BlockedDateSchema, WorkingHoursSchema } from "@/lib/validations";
import { parseDateOnly } from "@/lib/dates";

export type FormActionState = { message?: string } | undefined;

export async function addWorkingHoursAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  await requireAdmin();

  const validated = WorkingHoursSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotDurationMinutes: formData.get("slotDurationMinutes"),
  });

  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Datos inválidos." };
  }

  await prisma.workingHours.create({ data: validated.data });

  revalidatePath("/admin/horarios");
  revalidatePath("/turnos");
}

export async function deleteWorkingHoursAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.workingHours.delete({ where: { id } });
  revalidatePath("/admin/horarios");
  revalidatePath("/turnos");
}

export async function addBlockedDateAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  await requireAdmin();

  const validated = BlockedDateSchema.safeParse({
    date: formData.get("date"),
    fullDay: formData.get("fullDay") === "on",
    startTime: (formData.get("startTime") as string) || "",
    endTime: (formData.get("endTime") as string) || "",
    reason: (formData.get("reason") as string) || undefined,
  });

  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { date, fullDay, startTime, endTime, reason } = validated.data;

  await prisma.blockedDate.create({
    data: {
      date: parseDateOnly(date),
      startTime: fullDay ? null : startTime || null,
      endTime: fullDay ? null : endTime || null,
      reason,
    },
  });

  revalidatePath("/admin/bloqueos");
  revalidatePath("/turnos");
}

export async function deleteBlockedDateAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.blockedDate.delete({ where: { id } });
  revalidatePath("/admin/bloqueos");
  revalidatePath("/turnos");
}

export async function adminCancelAppointmentAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { patient: true },
  });

  await sendAppointmentCancelledEmail({
    to: appointment.patient.email,
    patientName: appointment.patient.name,
    dateLabel: formatDateLong(appointment.date),
    startTime: appointment.startTime,
  });

  revalidatePath("/admin");
  revalidatePath("/turnos/mis-turnos");
}

export async function markAppointmentCompletedAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.appointment.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath("/admin");
}
