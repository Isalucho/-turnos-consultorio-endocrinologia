import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WEEKDAYS_ES } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

import { deleteWorkingHoursAction } from "../actions";
import { WorkingHoursForm } from "./working-hours-form";

export default async function HorariosPage() {
  const workingHours = await prisma.workingHours.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const byDay = Array.from({ length: 7 }, (_, day) => workingHours.filter((wh) => wh.dayOfWeek === day));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Horarios de atención</h1>
        <p className="text-zinc-600">
          Definí la plantilla semanal de atención. Podés agregar más de una franja por día (ej. mañana y tarde).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar franja horaria</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkingHoursForm />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {byDay.map((ranges, day) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-base">{WEEKDAYS_ES[day]}</CardTitle>
              {ranges.length === 0 && <CardDescription>Sin atención este día</CardDescription>}
            </CardHeader>
            {ranges.length > 0 && (
              <CardContent className="flex flex-col gap-2">
                {ranges.map((range) => (
                  <div
                    key={range.id}
                    className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <span>
                      {range.startTime} a {range.endTime} hs · turnos de {range.slotDurationMinutes} min
                    </span>
                    <form action={deleteWorkingHoursAction}>
                      <input type="hidden" name="id" value={range.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Quitar
                      </Button>
                    </form>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
