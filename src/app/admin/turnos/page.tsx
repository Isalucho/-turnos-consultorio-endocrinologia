import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/admin/avatar";
import { AppointmentStatusPill, PaymentStatusPill } from "@/components/admin/status-pill";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { CONSULT_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, PaymentStatus, Prisma } from "@prisma/client";
import Link from "next/link";

import { adminCancelAppointmentAction, markAppointmentCompletedAction, undoPaymentAction } from "../actions";
import { AppointmentFiltersForm } from "../appointment-filters-form";
import { PaymentForm } from "../payment-form";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminAppointmentsPage(props: PageProps<"/admin/turnos">) {
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
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Turnos</h1>
        <p className="mt-1 text-muted-foreground">Listado de los turnos del consultorio y si ya pagaron.</p>
      </div>

      {paymentError && (
        <Alert variant="destructive">
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <AppointmentFiltersForm dateParam={dateParam} statusParam={statusParam} paymentParam={paymentParam} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pagados (en este listado)"
          value={paid.length}
          hint={`Efectivo ${countByMethod("EFECTIVO")} · Transferencia ${countByMethod("TRANSFERENCIA")}`}
        />
        <StatCard label="Pendientes de pago" value={pendingCount} />
        <StatCard label="Turnos en el listado" value={appointments.length} />
      </div>

      <Card>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay turnos para este filtro.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Fecha y hora</TableHead>
                  <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Paciente</TableHead>
                  <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Estado</TableHead>
                  <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Cobro</TableHead>
                  <TableHead className="text-right text-xs tracking-wide text-muted-foreground uppercase">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => {
                  const canCharge = appointment.status !== "CANCELLED" && appointment.paymentStatus === "PENDING";
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{appointment.startTime} hs</div>
                        <div className="text-xs text-muted-foreground">{formatDateLong(appointment.date)}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-start gap-3">
                          <Avatar name={appointment.patient.name} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/pacientes/${appointment.patient.id}`}
                              className="font-medium underline-offset-2 hover:text-primary hover:underline"
                            >
                              {appointment.patient.name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              DNI {appointment.patient.dni}
                              {appointment.patient.obraSocial ? ` · ${appointment.patient.obraSocial}` : ""}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {appointment.patient.phone}
                              {appointment.patient.email ? ` · ${appointment.patient.email}` : ""}
                            </div>
                            {appointment.reason && (
                              <div className="mt-0.5 max-w-60 truncate text-xs text-foreground/80">{appointment.reason}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <AppointmentStatusPill status={appointment.status} />
                        <div className="mt-1.5 text-xs text-muted-foreground">{CONSULT_TYPE_LABEL[appointment.consultType]}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        {appointment.paymentStatus === "PAID" ? (
                          <div className="flex flex-col items-start gap-1">
                            <PaymentStatusPill status="PAID" />
                            <span className="text-xs text-muted-foreground">
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
                          <div className="flex flex-col items-start gap-2">
                            <PaymentStatusPill status="PENDING" />
                            <PaymentForm id={appointment.id} defaultType={appointment.consultType} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top">
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
    </>
  );
}
