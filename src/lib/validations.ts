import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.email("Ingresá un email válido.").trim(),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido."),
  dni: z.string().trim().min(6, "Ingresá un DNI válido."),
  obraSocial: z.string().trim().optional(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[a-zA-Z]/, "Debe contener al menos una letra.")
    .regex(/[0-9]/, "Debe contener al menos un número."),
});

export const LoginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const BookAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horario inválido."),
  reason: z.string().trim().max(300).optional(),
});

export const WorkingHoursSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horario inválido."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Horario inválido."),
    slotDurationMinutes: z.coerce.number().int().min(5).max(240),
  })
  .refine((data) => data.startTime < data.endTime, {
    error: "El horario de inicio debe ser anterior al de fin.",
    path: ["endTime"],
  });

export const BlockedDateSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
    fullDay: z.coerce.boolean(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.fullDay || (data.startTime && data.endTime), {
    error: "Indicá un horario de inicio y fin, o marcá el día completo.",
    path: ["startTime"],
  });
