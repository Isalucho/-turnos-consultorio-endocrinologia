export const WEEKDAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Parsea un string "YYYY-MM-DD" a un Date en medianoche UTC (mismo formato que Prisma @db.Date). */
export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formatea un Date (medianoche UTC) a "YYYY-MM-DD". */
export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const CLINIC_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Fecha y hora actuales en la zona horaria del consultorio, sin importar dónde corra el servidor. */
function nowInClinicTimezone(): { year: number; month: number; day: number; hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hours: get("hour"),
    minutes: get("minute"),
  };
}

/** Fecha de hoy (en la zona horaria del consultorio) normalizada a medianoche UTC. */
export function todayDateOnly(): Date {
  const { year, month, day } = nowInClinicTimezone();
  return new Date(Date.UTC(year, month - 1, day));
}

export function isSameDate(a: Date, b: Date): boolean {
  return formatDateISO(a) === formatDateISO(b);
}

export function formatDateLong(date: Date): string {
  const weekday = WEEKDAYS_ES[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = MONTHS_ES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${weekday} ${day} de ${month} de ${year}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Minutos actuales (hora del consultorio), usado para descartar horarios pasados si la fecha es hoy. */
export function currentMinutesOfDay(): number {
  const { hours, minutes } = nowInClinicTimezone();
  return hours * 60 + minutes;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
