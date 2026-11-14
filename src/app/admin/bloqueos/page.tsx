import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLong, todayDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

import { deleteBlockedDateAction } from "../actions";
import { BlockedDateForm } from "./blocked-date-form";

export default async function BloqueosPage() {
  const blockedDates = await prisma.blockedDate.findMany({
    where: { date: { gte: todayDateOnly() } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bloqueos</h1>
        <p className="text-muted-foreground">
          Bloqueá días completos o franjas horarias puntuales (vacaciones, feriados, ausencias).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar bloqueo</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockedDateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos bloqueos</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay bloqueos programados.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-foreground">{formatDateLong(blocked.date)}</span>{" "}
                    <span className="text-muted-foreground">
                      {blocked.startTime && blocked.endTime
                        ? `de ${blocked.startTime} a ${blocked.endTime} hs`
                        : "día completo"}
                      {blocked.reason ? ` · ${blocked.reason}` : ""}
                    </span>
                  </div>
                  <form action={deleteBlockedDateAction}>
                    <input type="hidden" name="id" value={blocked.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Quitar
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
