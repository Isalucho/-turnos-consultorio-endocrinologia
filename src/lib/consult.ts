import "server-only";
import type { ConsultType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

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
