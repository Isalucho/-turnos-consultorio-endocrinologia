import { prisma } from "@/lib/prisma";
import {
  currentMinutesOfDay,
  isSameDate,
  minutesToTime,
  timeToMinutes,
  todayDateOnly,
} from "@/lib/dates";

export type TimeSlot = { startTime: string; endTime: string };

/** Calcula los horarios disponibles para una fecha, combinando la plantilla
 * semanal, los bloqueos puntuales y los turnos ya confirmados. No persiste
 * "slots vacíos": se calculan on-demand en cada consulta. */
export async function getAvailableSlots(date: Date): Promise<TimeSlot[]> {
  const dayOfWeek = date.getUTCDay();
  const isToday = isSameDate(date, todayDateOnly());

  const [workingHours, blockedRanges, appointments] = await Promise.all([
    prisma.workingHours.findMany({ where: { dayOfWeek } }),
    prisma.blockedDate.findMany({ where: { date } }),
    prisma.appointment.findMany({
      where: { date, status: "CONFIRMED" },
      select: { startTime: true },
    }),
  ]);

  if (workingHours.length === 0) return [];
  if (blockedRanges.some((b) => !b.startTime)) return []; // día completo bloqueado

  const bookedTimes = new Set(appointments.map((a) => a.startTime));
  const nowMinutes = isToday ? currentMinutesOfDay() : -1;

  const slots: TimeSlot[] = [];

  for (const wh of workingHours) {
    const endMinutes = timeToMinutes(wh.endTime);
    let cursor = timeToMinutes(wh.startTime);

    while (cursor + wh.slotDurationMinutes <= endMinutes) {
      const slotEnd = cursor + wh.slotDurationMinutes;
      const startTime = minutesToTime(cursor);
      const endTime = minutesToTime(slotEnd);

      const isPast = isToday && cursor <= nowMinutes;
      const isBooked = bookedTimes.has(startTime);
      const isBlocked = blockedRanges.some((b) => {
        if (!b.startTime || !b.endTime) return false;
        const blockStart = timeToMinutes(b.startTime);
        const blockEnd = timeToMinutes(b.endTime);
        return cursor < blockEnd && slotEnd > blockStart;
      });

      if (!isPast && !isBooked && !isBlocked) {
        slots.push({ startTime, endTime });
      }

      cursor = slotEnd;
    }
  }

  return slots;
}

/** true si el día tiene al menos una franja horaria configurada (independiente de si ya está lleno). */
export async function hasWorkingHours(dayOfWeek: number): Promise<boolean> {
  const count = await prisma.workingHours.count({ where: { dayOfWeek } });
  return count > 0;
}
