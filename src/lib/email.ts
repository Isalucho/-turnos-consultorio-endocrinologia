import "server-only";
import { Resend } from "resend";

import AppointmentCancelledEmail from "@/emails/appointment-cancelled";
import AppointmentConfirmedEmail from "@/emails/appointment-confirmed";
import AppointmentRescheduledEmail from "@/emails/appointment-rescheduled";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "Consultorio <onboarding@resend.dev>";

/** Si no hay API key configurada (ej. en desarrollo local), no falla: solo lo registra en consola. */
async function safeSend(params: Parameters<Resend["emails"]["send"]>[0]) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada, se omite el envío:", params.subject);
    return;
  }
  const { error } = await resend.emails.send(params);
  if (error) console.error("[email] Error al enviar:", error);
}

export async function sendAppointmentConfirmedEmail(params: {
  to: string;
  patientName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
}) {
  await safeSend({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Turno confirmado para el ${params.dateLabel}`,
    react: AppointmentConfirmedEmail({
      patientName: params.patientName,
      dateLabel: params.dateLabel,
      startTime: params.startTime,
      endTime: params.endTime,
    }),
  });
}

export async function sendAppointmentCancelledEmail(params: {
  to: string;
  patientName: string;
  dateLabel: string;
  startTime: string;
}) {
  await safeSend({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Turno cancelado (${params.dateLabel})`,
    react: AppointmentCancelledEmail({
      patientName: params.patientName,
      dateLabel: params.dateLabel,
      startTime: params.startTime,
    }),
  });
}

export async function sendAppointmentRescheduledEmail(params: {
  to: string;
  patientName: string;
  previousDateLabel: string;
  previousStartTime: string;
  newDateLabel: string;
  newStartTime: string;
  newEndTime: string;
}) {
  await safeSend({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Turno reprogramado para el ${params.newDateLabel}`,
    react: AppointmentRescheduledEmail({
      patientName: params.patientName,
      previousDateLabel: params.previousDateLabel,
      previousStartTime: params.previousStartTime,
      newDateLabel: params.newDateLabel,
      newStartTime: params.newStartTime,
      newEndTime: params.newEndTime,
    }),
  });
}
