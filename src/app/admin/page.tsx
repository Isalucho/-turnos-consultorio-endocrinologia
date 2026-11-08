import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { APPOINTMENT_STATUS_BADGE_VARIANT, APPOINTMENT_STATUS_LABEL } from "@/lib/appointment-status";
import { formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { CONSULT_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, PaymentStatus, Prisma } from "@prisma/client";

import { adminCancelAppointmentAction, markAppointmentCompletedAction, undoPaymentAction } from "./actions";
import { AppointmentFiltersForm } from "./appointment-filters-form";
import { PaymentForm } from "./payment-form";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminAppointmentsPage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams.date === "string" && ISO_DATE_RE.test(searchParams.date) ? searchParams.date : undefined;
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "CONFIRMED";
  const paymentParam = typeof searchParams.pago === "string" ? searchParams.pago : "ALL";
  const paymentError = typeof searchParams.pagoError === "string" ? searchParams.pagoError : undefined;

  const where: Prisma.AppointmentWhereInput = {};
  if (dateParam) {
    where.date = parseDateOnly(dateParam);
  } else {
    where.date = { gte: todayDateOnly() };
  }
  if (statusParam !== "ALL") {
    where.status = statusParam as AppointmentStatus;
  }
  if (paymentParam === "PENDING" || paymentParam === "PAID") {
    where.paymentStatus = paymentParam as PaymentStatus;
    where.status = statusParam === "ALL" ? { not: "CANCELLED" } : where.status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const paid = appointments.filter((a) => a.paymentStatus === "PAID");
  const countByMethod = (method: "EFECTIVO" | "TRANSFERENCIA") => paid.filter((a) => a.paymentMethod === method).length;
  const pendingCount = appointments.filter((a) => a.status !== "CANCELLED" && a.paymentStatus === "PENDING").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Turnos</h1>
        <p className="text-zinc-600">Listado de los turnos del consultorio y si ya pagaron.</p>
      </div>

      {paymentError && (
        <Alert variant="destructive">
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentFiltersForm dateParam={dateParam} statusParam={statusParam} paymentParam={paymentParam} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-zinc-500">Pagados (en este listado)</p>
            <p className="text-xl font-semibold text-zinc-900">{paid.length}</p>
            <p className="text-xs text-zinc-500">
              Efectivo {countByMethod("EFECTIVO")} · Transferencia {countByMethod("TRANSFERENCIA")}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-zinc-500">Pendientes de pago</p>
            <p className="text-xl font-semibold text-zinc-900">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-zinc-500">Turnos en el listado</p>
            <p className="text-xl font-semibold text-zinc-900">{appointments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No hay turnos para este filtro.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cobro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => {
                  const canCharge = appointment.status !== "CANCELLED" && appointment.paymentStatus === "PENDING";
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium text-zinc-900">{appointment.startTime} hs</div>
                        <div className="text-xs text-zinc-500">{formatDateLong(appointment.date)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-zinc-900">{appointment.patient.name}</div>
                        <div className="text-xs text-zinc-500">
                          DNI {appointment.patient.dni}
                          {appointment.patient.obraSocial ? ` · ${appointment.patient.obraSocial}` : ""}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {appointment.patient.phone}
                          {appointment.patient.email ? ` · ${appointment.patient.email}` : ""}
                        </div>
                        {appointment.reason && (
                          <div className="mt-0.5 max-w-60 truncate text-xs text-zinc-600">{appointment.reason}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={APPOINTMENT_STATUS_BADGE_VARIANT[appointment.status]}>
                          {APPOINTMENT_STATUS_LABEL[appointment.status]}
                        </Badge>
                        <div className="mt-1 text-xs text-zinc-500">{CONSULT_TYPE_LABEL[appointment.consultType]}</div>
                      </TableCell>
                      <TableCell>
                        {appointment.paymentStatus === "PAID" ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="secondary">Pagado</Badge>
                            <span className="text-xs text-zinc-600">
                              {appointment.paymentMethod ? PAYMENT_METHOD_LABEL[appointment.paymentMethod] : ""}
                            </span>
                            <form action={undoPaymentAction}>
                              <input type="hidden" name="id" value={appointment.id} />
                              <ConfirmSubmitButton
                                size="xs"
                                variant="ghost"
                                confirmMessage="¿Deshacer el pago de este turno? Va a volver a figurar como pendiente."
                              >
                                Deshacer pago
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        ) : canCharge ? (
                          <PaymentForm
                            id={appointment.id}
                            defaultType={appointment.consultType}
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {appointment.status === "CONFIRMED" && (
                          <div className="flex flex-col items-end gap-1.5">
                            <form action={markAppointmentCompletedAction}>
                              <input type="hidden" name="id" value={appointment.id} />
                              <Button type="submit" size="sm" variant="outline">
                                Marcar realizado
                              </Button>
                            </form>
                            <form action={adminCancelAppointmentAction}>
                              <input type="hidden" name="id" value={appointment.id} />
                              <ConfirmSubmitButton
                                size="sm"
                                variant="destructive"
                                confirmMessage="¿Cancelar este turno? Si el paciente tiene email, se le avisa."
                              >
                                Cancelar
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
