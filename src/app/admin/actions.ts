"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { sendAppointmentCancelledEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { BlockedDateSchema, WorkingHoursSchema } from "@/lib/validations";

export type FormActionState = { message?: string } | undefined;

function formatShortDate(date: Date) {
  const [year, month, day] = date.toISOString().slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

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

  const { dayOfWeek, startTime, endTime } = validated.data;

  const sameDay = await prisma.workingHours.findMany({ where: { dayOfWeek } });
  const overlapping = sameDay.find((existing) => startTime < existing.endTime && endTime > existing.startTime);
  if (overlapping) {
    return {
      message: `Esa franja se superpone con la de ${overlapping.startTime} a ${overlapping.endTime} hs que ya cargaste ese día. Quitá o ajustá la existente primero.`,
    };
  }

  await prisma.workingHours.create({ data: validated.data });

  revalidatePath("/admin/horarios");
  revalidatePath("/turnos");
}

export async function deleteWorkingHoursAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const range = await prisma.workingHours.findUnique({ where: { id } });
  if (!range) {
    revalidatePath("/admin/horarios");
    return;
  }

  // Si se quita una franja con turnos confirmados a futuro, esos turnos quedarían fuera de la agenda sin aviso.
  const futureAppointments = await prisma.appointment.findMany({
    where: { status: "CONFIRMED", date: { gte: todayDateOnly() } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  const affected = futureAppointments.filter(
    (appointment) =>
      appointment.date.getUTCDay() === range.dayOfWeek &&
      appointment.startTime >= range.startTime &&
      appointment.startTime < range.endTime,
  );

  if (affected.length > 0) {
    const first = affected[0];
    const message = `No se puede quitar esta franja: hay ${affected.length} turno(s) confirmado(s) dentro de ella (el primero, el ${formatShortDate(first.date)} a las ${first.startTime}). Cancelalos o reprogramalos desde Turnos y después quitala.`;
    redirect(`/admin/horarios?error=${encodeURIComponent(message)}`);
  }

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
  const blockedDate = parseDateOnly(date);

  if (blockedDate.getTime() < todayDateOnly().getTime()) {
    return { message: "No se pueden bloquear fechas pasadas." };
  }

  const confirmed = await prisma.appointment.findMany({
    where: { date: blockedDate, status: "CONFIRMED" },
    include: { patient: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });
  const conflicts = fullDay
    ? confirmed
    : confirmed.filter((a) => a.startTime < (endTime as string) && a.endTime > (startTime as string));

  if (conflicts.length > 0) {
    const list = conflicts.map((a) => `${a.startTime} (${a.patient.name})`).join(", ");
    return {
      message: `Ese bloqueo se superpone con ${conflicts.length} turno(s) confirmado(s): ${list}. Cancelalos o reprogramalos desde Turnos y después cargá el bloqueo.`,
    };
  }

  await prisma.blockedDate.create({
    data: {
      date: blockedDate,
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
  await prisma.blockedDate.deleteMany({ where: { id } });
  revalidatePath("/admin/bloqueos");
  revalidatePath("/turnos");
}

export async function adminCancelAppointmentAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  // Solo se cancelan turnos confirmados: no se pisa un turno ya realizado o ya cancelado.
  const { count } = await prisma.appointment.updateMany({
    where: { id, status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  });
  if (count === 0) {
    revalidatePath("/admin");
    return;
  }

  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { patient: true } });

  if (appointment?.patient.email) {
    await sendAppointmentCancelledEmail({
      to: appointment.patient.email,
      patientName: appointment.patient.name,
      dateLabel: formatDateLong(appointment.date),
      startTime: appointment.startTime,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/turnos/mis-turnos");
}

export async function markAppointmentCompletedAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  await prisma.appointment.updateMany({ where: { id, status: "CONFIRMED" }, data: { status: "COMPLETED" } });
  revalidatePath("/admin");
}
