import type { AppointmentStatus, PaymentStatus } from "@prisma/client";

import { APPOINTMENT_STATUS_LABEL } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";

export type PillTone = "success" | "info" | "warn" | "danger" | "neutral";

const TONE_CLASSES: Record<PillTone, string> = {
  success: "bg-emerald-500/15 text-emerald-300",
  info: "bg-sky-500/15 text-sky-300",
  warn: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/15 text-red-300",
  neutral: "bg-slate-500/20 text-slate-300",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const APPOINTMENT_TONE: Record<AppointmentStatus, PillTone> = {
  CONFIRMED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function AppointmentStatusPill({ status }: { status: AppointmentStatus }) {
  return <StatusPill tone={APPOINTMENT_TONE[status]}>{APPOINTMENT_STATUS_LABEL[status]}</StatusPill>;
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return status === "PAID" ? (
    <StatusPill tone="success">Pagado</StatusPill>
  ) : (
    <StatusPill tone="warn">Pendiente</StatusPill>
  );
}
