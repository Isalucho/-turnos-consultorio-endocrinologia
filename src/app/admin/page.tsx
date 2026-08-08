import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, Prisma } from "@prisma/client";

import { adminCancelAppointmentAction, markAppointmentCompletedAction } from "./actions";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Realizado",
};

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, "default" | "secondary" | "destructive"> = {
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminAppointmentsPage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams.date === "string" && ISO_DATE_RE.test(searchParams.date) ? searchParams.date : undefined;
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "CONFIRMED";

  const where: Prisma.AppointmentWhereInput = {};
  if (dateParam) {
    where.date = parseDateOnly(dateParam);
  } else {
    where.date = { gte: todayDateOnly() };
  }
  if (statusParam !== "ALL") {
    where.status = statusParam as AppointmentStatus;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Turnos</h1>
        <p className="text-zinc-600">Listado de todos los turnos del consultorio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input type="date" id="date" name="date" defaultValue={dateParam} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={statusParam}
                className="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="CONFIRMED">Confirmados</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="COMPLETED">Realizados</option>
                <option value="ALL">Todos</option>
              </select>
            </div>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
            {dateParam && (
              <a href="/admin" className={buttonVariants({ variant: "ghost" })}>
                Limpiar fecha
              </a>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No hay turnos para este filtro.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDateLong(appointment.date)}</TableCell>
                    <TableCell>
                      {appointment.startTime} - {appointment.endTime}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-zinc-900">{appointment.patient.name}</div>
                      <div className="text-xs text-zinc-500">
                        DNI {appointment.patient.dni}
                        {appointment.patient.obraSocial ? ` · ${appointment.patient.obraSocial}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      <div>{appointment.patient.email}</div>
                      <div>{appointment.patient.phone}</div>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-sm text-zinc-600">
                      {appointment.reason ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[appointment.status]}>
                        {STATUS_LABEL[appointment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {appointment.status === "CONFIRMED" && (
                        <div className="flex justify-end gap-2">
                          <form action={markAppointmentCompletedAction}>
                            <input type="hidden" name="id" value={appointment.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Marcar realizado
                            </Button>
                          </form>
                          <form action={adminCancelAppointmentAction}>
                            <input type="hidden" name="id" value={appointment.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Cancelar
                            </Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
