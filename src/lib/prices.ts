import "server-only";
import type { ConsultType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type Prices = { firstConsultPrice: number; followUpPrice: number };

export async function getPrices(): Promise<Prices> {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  return {
    firstConsultPrice: settings?.firstConsultPrice ?? 0,
    followUpPrice: settings?.followUpPrice ?? 0,
  };
}

export function priceFor(type: ConsultType, prices: Prices): number {
  return type === "PRIMERA" ? prices.firstConsultPrice : prices.followUpPrice;
}

/** Primera consulta si el paciente todavía no tiene ningún turno no cancelado. */
export async function suggestConsultType(
  patientId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<ConsultType> {
  const previous = await db.appointment.count({
    where: { patientId, status: { not: "CANCELLED" } },
  });
  return previous === 0 ? "PRIMERA" : "CONTROL";
}
