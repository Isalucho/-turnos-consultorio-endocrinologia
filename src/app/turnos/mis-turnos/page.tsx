import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLong, todayDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requirePaciente } from "@/lib/session";

import { cancelAppointmentAction } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Realizado",
};

export default async function MisTurnosPage(props: PageProps<"/turnos/mis-turnos">) {
  const user = await requirePaciente();
  const searchParams = await props.searchParams;
  const justConfirmed = searchParams.confirmado === "1";

  const today = todayDateOnly();

  const appointments = await prisma.appointment.findMany({
    where: { patientId: user.id },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const upcoming = appointments.filter((a) => a.status === "CONFIRMED" && a.date.getTime() >= today.getTime());
  const history = appointments.filter((a) => !upcoming.includes(a));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mis turnos</h1>
          <p className="text-zinc-600">Gestioná tus turnos confirmados.</p>
        </div>
        <Link href="/turnos" className={buttonVariants()}>
          Sacar nuevo turno
        </Link>
      </div>

      {justConfirmed && (
        <Alert>
          <AlertTitle>¡Listo!</AlertTitle>
          <AlertDescription>Tu turno se registró correctamente. Te enviamos un email de confirmación.</AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Próximos</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500">No tenés turnos próximos.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{formatDateLong(appointment.date)}</CardTitle>
                    <CardDescription>
                      {appointment.startTime} a {appointment.endTime} hs
                    </CardDescription>
                  </div>
                  <Badge>{STATUS_LABEL[appointment.status]}</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {appointment.reason && <p className="w-full text-sm text-zinc-600">Motivo: {appointment.reason}</p>}
                  <Link
                    href={`/turnos?reschedule=${appointment.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Reprogramar
                  </Link>
                  <form action={cancelAppointmentAction}>
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Cancelar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Historial</h2>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay turnos pasados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm"
              >
                <span className="text-zinc-700">
                  {formatDateLong(appointment.date)} · {appointment.startTime} hs
                </span>
                <Badge variant="secondary">{STATUS_LABEL[appointment.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
