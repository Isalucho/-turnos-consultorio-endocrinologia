"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAvailableSlots } from "@/lib/availability";
import { formatDateLong, parseDateOnly } from "@/lib/dates";
import { sendAppointmentCancelledEmail, sendAppointmentConfirmedEmail, sendAppointmentRescheduledEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requirePaciente } from "@/lib/session";
import { BookAppointmentSchema } from "@/lib/validations";

export type BookState = { message?: string } | undefined;

export async function bookAppointmentAction(_state: BookState, formData: FormData): Promise<BookState> {
  const user = await requirePaciente();

  const validated = BookAppointmentSchema.safeParse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    reason: (formData.get("reason") as string) || undefined,
  });

  if (!validated.success) {
    return { message: "Elegí un horario válido para continuar." };
  }

  const rescheduleId = (formData.get("rescheduleId") as string) || null;
  const { date: dateStr, startTime, reason } = validated.data;
  const date = parseDateOnly(dateStr);

  // Se revalida la disponibilidad en el servidor por si cambió desde que se cargó la página.
  const slots = await getAvailableSlots(date);
  const slot = slots.find((s) => s.startTime === startTime);
  if (!slot) {
    return { message: "Ese horario ya no está disponible. Elegí otro." };
  }

  let previousAppointment = null;
  if (rescheduleId) {
    previousAppointment = await prisma.appointment.findUnique({ where: { id: rescheduleId } });
    if (
      !previousAppointment ||
      previousAppointment.patientId !== user.id ||
      previousAppointment.status !== "CONFIRMED"
    ) {
      return { message: "No se pudo reprogramar ese turno." };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (previousAppointment) {
        await tx.appointment.update({
          where: { id: previousAppointment.id },
          data: { status: "CANCELLED" },
        });
      }

      // Chequeo dentro de la transacción para evitar doble-booking por una condición de carrera.
      const clash = await tx.appointment.findFirst({
        where: { date, startTime: slot.startTime, status: "CONFIRMED" },
      });
      if (clash) throw new Error("SLOT_TAKEN");

      await tx.appointment.create({
        data: {
          patientId: user.id,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return { message: "Ese horario se acaba de ocupar. Elegí otro." };
    }
    throw error;
  }

  const dateLabel = formatDateLong(date);
  const patientEmail = user.email as string;
  const patientName = user.name ?? "Paciente";

  if (previousAppointment) {
    await sendAppointmentRescheduledEmail({
      to: patientEmail,
      patientName,
      previousDateLabel: formatDateLong(previousAppointment.date),
      previousStartTime: previousAppointment.startTime,
      newDateLabel: dateLabel,
      newStartTime: slot.startTime,
      newEndTime: slot.endTime,
    });
  } else {
    await sendAppointmentConfirmedEmail({
      to: patientEmail,
      patientName,
      dateLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  }

  revalidatePath("/admin");
  redirect("/turnos/mis-turnos?confirmado=1");
}

export async function cancelAppointmentAction(formData: FormData) {
  const user = await requirePaciente();
  const appointmentId = formData.get("appointmentId") as string;

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.patientId !== user.id || appointment.status !== "CONFIRMED") {
    return;
  }

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "CANCELLED" } });

  await sendAppointmentCancelledEmail({
    to: user.email as string,
    patientName: user.name ?? "Paciente",
    dateLabel: formatDateLong(appointment.date),
    startTime: appointment.startTime,
  });

  revalidatePath("/turnos/mis-turnos");
  revalidatePath("/admin");
}
