import { currentMinutesOfDay, isSameDate, minutesToTime, timeToMinutes, todayDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type { Appointment, User } from "@prisma/client";

export type AgendaAppointment = Appointment & { patient: Pick<User, "id" | "name" | "dni"> };

export type AgendaEntry =
  | { kind: "booked"; startTime: string; endTime: string; appointment: AgendaAppointment }
  | { kind: "blocked"; startTime: string; endTime: string; reason: string | null }
  | { kind: "free"; startTime: string; endTime: string; past: boolean };

export type DayAgenda = {
  entries: AgendaEntry[];
  /** Si el día completo está bloqueado, el motivo (puede ser null si no se cargó). */
  dayBlocked: { reason: string | null } | null;
  hasWorkingHours: boolean;
};

/** Arma la agenda de un día para mostrar en el panel: cada horario del día
 * queda como ocupado (turno), bloqueado o libre. A diferencia de
 * getAvailableSlots, acá también se ven los turnos y los bloqueos. */
export async function getDayAgenda(date: Date): Promise<DayAgenda> {
  const isToday = isSameDate(date, todayDateOnly());
  const nowMinutes = isToday ? currentMinutesOfDay() : -1;

  const [workingHours, blockedRanges, appointments] = await Promise.all([
    prisma.workingHours.findMany({ where: { dayOfWeek: date.getUTCDay() }, orderBy: { startTime: "asc" } }),
    prisma.blockedDate.findMany({ where: { date } }),
    prisma.appointment.findMany({
      where: { date, status: { not: "CANCELLED" } },
      include: { patient: { select: { id: true, name: true, dni: true } } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const fullDay = blockedRanges.find((b) => !b.startTime);
  const dayBlocked = fullDay ? { reason: fullDay.reason } : null;

  const entries: AgendaEntry[] = [];
  const usedAppointmentIds = new Set<string>();

  for (const wh of workingHours) {
    const endMinutes = timeToMinutes(wh.endTime);
    let cursor = timeToMinutes(wh.startTime);

    while (cursor + wh.slotDurationMinutes <= endMinutes) {
      const slotEnd = cursor + wh.slotDurationMinutes;
      const startTime = minutesToTime(cursor);
      const endTime = minutesToTime(slotEnd);

      const appointment = appointments.find((a) => a.startTime === startTime && !usedAppointmentIds.has(a.id));
      const block = blockedRanges.find((b) => {
        if (!b.startTime || !b.endTime) return false;
        return cursor < timeToMinutes(b.endTime) && slotEnd > timeToMinutes(b.startTime);
      });

      if (appointment) {
        usedAppointmentIds.add(appointment.id);
        entries.push({ kind: "booked", startTime, endTime, appointment });
      } else if (dayBlocked || block) {
        entries.push({ kind: "blocked", startTime, endTime, reason: dayBlocked ? dayBlocked.reason : (block?.reason ?? null) });
      } else {
        entries.push({ kind: "free", startTime, endTime, past: cursor <= nowMinutes });
      }

      cursor = slotEnd;
    }
  }

  // Turnos que no caen justo en un horario de la grilla (por ejemplo si cambiaron los horarios después): no se esconden.
  for (const appointment of appointments) {
    if (usedAppointmentIds.has(appointment.id)) continue;
    entries.push({ kind: "booked", startTime: appointment.startTime, endTime: appointment.endTime, appointment });
  }

  entries.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return { entries, dayBlocked, hasWorkingHours: workingHours.length > 0 };
}
