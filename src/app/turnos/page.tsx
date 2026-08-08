import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailableSlots } from "@/lib/availability";
import { formatDateISO, formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requirePaciente } from "@/lib/session";

import { BookForm } from "./book-form";
import { DateFilterForm } from "./date-filter-form";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function TurnosPage(props: PageProps<"/turnos">) {
  const user = await requirePaciente();
  const searchParams = await props.searchParams;

  const today = todayDateOnly();
  const todayISO = formatDateISO(today);

  const dateParam = typeof searchParams.date === "string" ? searchParams.date : undefined;
  const rescheduleId = typeof searchParams.reschedule === "string" ? searchParams.reschedule : undefined;

  let selectedDateISO = todayISO;
  if (dateParam && ISO_DATE_RE.test(dateParam)) {
    const parsed = parseDateOnly(dateParam);
    if (parsed.getTime() >= today.getTime()) {
      selectedDateISO = dateParam;
    }
  }

  const selectedDate = parseDateOnly(selectedDateISO);
  const slots = await getAvailableSlots(selectedDate);

  const rescheduleAppointment = rescheduleId
    ? await prisma.appointment.findFirst({
        where: { id: rescheduleId, patientId: user.id, status: "CONFIRMED" },
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Sacar turno</h1>
        <p className="text-zinc-600">Elegí un día y horario disponible.</p>
      </div>

      {rescheduleAppointment && (
        <Alert>
          <AlertTitle>Reprogramando turno</AlertTitle>
          <AlertDescription>
            Vas a reemplazar tu turno del {formatDateLong(rescheduleAppointment.date)} a las{" "}
            {rescheduleAppointment.startTime} hs. Elegí el nuevo horario abajo.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Elegí una fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilterForm selectedDateISO={selectedDateISO} todayISO={todayISO} rescheduleId={rescheduleId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{formatDateLong(selectedDate)}</CardTitle>
          <CardDescription>Horarios disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <BookForm date={selectedDateISO} slots={slots} rescheduleId={rescheduleAppointment?.id} />
        </CardContent>
      </Card>
    </div>
  );
}
