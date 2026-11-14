import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/avatar";
import { StatusPill } from "@/components/admin/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateISO, todayDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 100;

function formatShortDate(date: Date): string {
  const [year, month, day] = formatDateISO(date).split("-");
  return `${day}/${month}/${year}`;
}

export default async function PacientesPage(props: PageProps<"/admin/pacientes">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const today = todayDateOnly();

  const where: Prisma.UserWhereInput = {
    role: "PACIENTE",
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { dni: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [patients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      include: {
        appointments: { where: { status: { not: "CANCELLED" } }, select: { date: true, status: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const rows = patients.map((patient) => {
    const completed = patient.appointments.filter((a) => a.status === "COMPLETED").map((a) => a.date.getTime());
    const next = patient.appointments
      .filter((a) => a.status === "CONFIRMED" && a.date.getTime() >= today.getTime())
      .map((a) => a.date.getTime());
    return {
      patient,
      lastVisit: completed.length ? new Date(Math.max(...completed)) : null,
      nextVisit: next.length ? new Date(Math.min(...next)) : null,
      appointmentCount: patient.appointments.length,
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pacientes</h1>
          <p className="mt-1 text-muted-foreground">
            {total} {total === 1 ? "paciente" : "pacientes"} {q ? "encontrados" : "registrados"}.
          </p>
        </div>
        <Link href="/admin/pacientes/nuevo" className={buttonVariants({ size: "lg" })}>
          <Plus /> Nuevo paciente
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <form method="get" className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={q} placeholder="Buscar por nombre, DNI o email..." className="h-9 pl-8" />
            </div>
            <Button type="submit" variant="outline" size="lg">
              Buscar
            </Button>
            {q && (
              <Link href="/admin/pacientes" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Limpiar
              </Link>
            )}
          </form>

          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron pacientes.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Paciente</TableHead>
                    <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">DNI</TableHead>
                    <TableHead className="hidden text-xs tracking-wide text-muted-foreground uppercase md:table-cell">Contacto</TableHead>
                    <TableHead className="hidden text-xs tracking-wide text-muted-foreground uppercase lg:table-cell">Última visita</TableHead>
                    <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ patient, lastVisit, nextVisit, appointmentCount }) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={patient.name} className="size-10" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/pacientes/${patient.id}`}
                              className="font-semibold underline-offset-2 hover:text-primary hover:underline"
                            >
                              {patient.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{patient.obraSocial ?? "Sin obra social"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{patient.dni}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        <div>{patient.phone}</div>
                        {patient.email && <div className="max-w-52 truncate">{patient.email}</div>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{lastVisit ? formatShortDate(lastVisit) : "-"}</TableCell>
                      <TableCell>
                        {nextVisit ? (
                          <StatusPill tone="info">Turno el {formatShortDate(nextVisit)}</StatusPill>
                        ) : appointmentCount === 0 ? (
                          <StatusPill tone="neutral">Sin turnos</StatusPill>
                        ) : (
                          <StatusPill tone="success">Al día</StatusPill>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/pacientes/${patient.id}`} className="text-sm text-primary hover:underline">
                          Ver
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">
                Mostrando {rows.length} de {total} {total === 1 ? "paciente" : "pacientes"}
                {total > rows.length && ". Usá el buscador para encontrar a alguien en particular"}.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
