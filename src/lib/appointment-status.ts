import type { AppointmentStatus } from "@prisma/client";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Realizado",
};

export const APPOINTMENT_STATUS_BADGE_VARIANT: Record<AppointmentStatus, "default" | "secondary" | "destructive"> = {
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
};
