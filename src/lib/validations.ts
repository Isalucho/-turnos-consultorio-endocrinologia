import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Fecha inválida.");

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario inválido.");

const dni = z
  .string()
  .transform((value) => value.replace(/[.\s]/g, ""))
  .pipe(z.string().regex(/^\d{6,9}$/, "Ingresá el DNI solo con números (6 a 9 dígitos)."));

const passwordRules = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[a-zA-Z]/, "Debe contener al menos una letra.")
  .regex(/[0-9]/, "Debe contener al menos un número.");

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.email("Ingresá un email válido.").trim(),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido."),
  dni,
  obraSocial: z.string().trim().optional(),
  password: passwordRules,
  privacyAccepted: z.literal("on", {
    error: "Tenés que aceptar la política de privacidad para continuar.",
  }),
});

export const LoginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const AdminCreatePatientSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  dni,
  phone: z.string().trim().min(6, "Ingresá un teléfono válido."),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, "Ingresá un email válido.")
    .transform((value) => value || undefined),
  obraSocial: z.string().trim().optional(),
});

export const AdminBookAppointmentSchema = z.object({
  patientId: z.string().min(1),
  date: isoDate,
  startTime: timeOfDay,
  reason: z.string().trim().max(300).optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.email("Ingresá un email válido.").trim(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const BookAppointmentSchema = z.object({
  date: isoDate,
  startTime: timeOfDay,
  reason: z.string().trim().max(300).optional(),
});

export const WorkingHoursSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: timeOfDay,
    endTime: timeOfDay,
    slotDurationMinutes: z.coerce.number().int().min(5).max(240),
  })
  .refine((data) => data.startTime < data.endTime, {
    error: "El horario de inicio debe ser anterior al de fin.",
    path: ["endTime"],
  });

export const ClinicalNoteSchema = z.object({
  date: isoDate,
  weightKg: z.coerce.number().positive().max(500).optional().or(z.literal("").transform(() => undefined)),
  bloodPressure: z.string().trim().max(20, "La presión arterial es demasiado larga.").optional(),
  diagnosis: z.string().trim().max(2000, "El diagnóstico supera los 2000 caracteres.").optional(),
  treatment: z.string().trim().max(2000, "El tratamiento supera los 2000 caracteres.").optional(),
  labResults: z.string().trim().max(2000, "Los resultados de laboratorio superan los 2000 caracteres.").optional(),
  notes: z.string().trim().max(5000, "Las notas superan los 5000 caracteres.").optional(),
});

export const BlockedDateSchema = z
  .object({
    date: isoDate,
    fullDay: z.coerce.boolean(),
    startTime: timeOfDay.optional().or(z.literal("")),
    endTime: timeOfDay.optional().or(z.literal("")),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.fullDay || (data.startTime && data.endTime), {
    error: "Indicá un horario de inicio y fin, o marcá el día completo.",
    path: ["startTime"],
  })
  .refine((data) => data.fullDay || !data.startTime || !data.endTime || data.startTime < data.endTime, {
    error: "El horario de inicio debe ser anterior al de fin.",
    path: ["endTime"],
  });
