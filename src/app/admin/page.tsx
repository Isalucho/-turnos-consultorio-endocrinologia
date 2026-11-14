import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/avatar";
import { AppointmentStatusPill, PaymentStatusPill } from "@/components/admin/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  WEEKDAYS_ES,
  addDays,
  currentMinutesOfDay,
  formatDateISO,
  formatDateLong,
  minutesToTime,
  parseDateOnly,
  timeToMinutes,
  todayDateOnly,
} from "@/lib/dates";
import { type AgendaEntry, getDayAgenda } from "@/lib/day-agenda";
import { CONSULT_TYPE_LABEL } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TODAY_ROWS_LIMIT = 8;

function greeting(): string {
  const minutes = currentMinutesOfDay();
  if (minutes < 12 * 60) return "Buen día";
  if (minutes < 20 * 60) return "Buenas tardes";
  return "Buenas noches";
}

function StatCard({ label, value, suffix, hint }: { label: string; value: React.ReactNode; suffix?: string; hint: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {value}
          {suffix && <span className="ml-1 text-lg font-normal text-muted-foreground">{suffix}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {done} <span className="font-normal text-muted-foreground">/ {total}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function slotDuration(entry: AgendaEntry): number {
  return timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime);
}

function AgendaSlot({ entry }: { entry: AgendaEntry }) {
  const minutes = slotDuration(entry);

  if (entry.kind === "free") {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border px-3 py-2.5 text-center text-sm text-muted-foreground",
          entry.past && "opacity-50",
        )}
      >
        Libre · {minutes} min
      </div>
    );
  }

  if (entry.kind === "blocked") {
    return (
      <div className="rounded-lg border-l-2 border-amber-400 bg-amber-500/10 px-3 py-2">
        <p className="text-sm font-medium text-amber-200">Bloqueado</p>
        <p className="text-xs text-amber-200/70">
          {entry.reason ? `${entry.reason} · ` : ""}
          {minutes} min
        </p>
      </div>
    );
  }

  const { appointment } = entry;
  const isFirst = appointment.consultType === "PRIMERA";
  return (
    <Link
      href={`/admin/pacientes/${appointment.patient.id}`}
      className={cn(
        "block rounded-lg border-l-2 px-3 py-2 transition-colors",
        isFirst
          ? "border-sky-400 bg-sky-500/10 hover:bg-sky-500/15"
          : "border-primary bg-primary/10 hover:bg-primary/15",
        appointment.status === "COMPLETED" && "opacity-70",
      )}
    >
      <p className={cn("text-sm font-medium", isFirst ? "text-sky-200" : "text-primary")}>
        {CONSULT_TYPE_LABEL[appointment.consultType]}
        {appointment.status === "COMPLETED" && " · Realizado"}
      </p>
      <p className="text-xs text-muted-foreground">
        {appointment.patient.name} · {minutes} min
      </p>
    </Link>
  );
}

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const user = await requireAdmin();
  const searchParams = await props.searchParams;

  const today = todayDateOnly();
  const dateParam = typeof searchParams.date === "string" && ISO_DATE_RE.test(searchParams.date) ? searchParams.date : undefined;
  const selectedDate = dateParam ? parseDateOnly(dateParam) : today;
  const selectedIsToday = formatDateISO(selectedDate) === formatDateISO(today);
  const nowTime = minutesToTime(currentMinutesOfDay());
  const weekdayName = WEEKDAYS_ES[today.getUTCDay()].toLowerCase();

  const [todayAppointments, lastWeekCount, pendingPayments, upcoming, todayAgenda, selectedAgenda] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: today, status: { not: "CANCELLED" } },
      include: { patient: { select: { id: true, name: true, dni: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.count({ where: { date: addDays(today, -7), status: { not: "CANCELLED" } } }),
    prisma.appointment.count({ where: { date: { lte: today }, status: { not: "CANCELLED" }, paymentStatus: "PENDING" } }),
    prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        OR: [{ date: { gt: today } }, { date: today, startTime: { gt: nowTime } }],
      },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
    getDayAgenda(today),
    selectedIsToday ? Promise.resolve(null) : getDayAgenda(selectedDate),
  ]);
  const agenda = selectedAgenda ?? todayAgenda;

  const totalToday = todayAppointments.length;
  const completedToday = todayAppointments.filter((a) => a.status === "COMPLETED").length;
  const paidToday = todayAppointments.filter((a) => a.paymentStatus === "PAID").length;
  const completedPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const openSlots = todayAgenda.entries.filter((e) => e.kind !== "blocked");
  const freeSlotsLeft = todayAgenda.entries.filter((e) => e.kind === "free" && !e.past).length;

  const diffPct = lastWeekCount > 0 ? Math.round(((totalToday - lastWeekCount) / lastWeekCount) * 100) : null;
  const todayHint =
    diffPct === null ? (
      `Sin turnos el ${weekdayName} pasado`
    ) : diffPct === 0 ? (
      `Igual que el ${weekdayName} pasado`
    ) : (
      <span className="inline-flex items-center gap-1">
        <span className={cn("inline-flex items-center font-medium", diffPct > 0 ? "text-emerald-400" : "text-amber-300")}>
          {diffPct > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(diffPct)}%
        </span>
        vs. {weekdayName} pasado
      </span>
    );

  const visibleToday = todayAppointments.slice(0, TODAY_ROWS_LIMIT);
  const hiddenToday = totalToday - visibleToday.length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{formatDateLong(today)}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Resumen del consultorio</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pacientes" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Dar turno
          </Link>
          <Link href="/admin/pacientes/nuevo" className={buttonVariants({ size: "lg" })}>
            <Plus /> Nuevo paciente
          </Link>
        </div>
      </div>

      <Card className="bg-linear-to-r from-primary/15 to-card">
        <CardContent>
          <p className="text-lg font-semibold">
            {greeting()}, {user.name ?? "Doctora"}
          </p>
          <p className="text-sm text-muted-foreground">
            {totalToday === 0
              ? "Hoy no hay turnos cargados."
              : `Hoy hay ${totalToday} ${totalToday === 1 ? "turno" : "turnos"} en el consultorio.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Turnos de hoy" value={totalToday} hint={todayHint} />
        <StatCard
          label="Atendidos"
          value={completedToday}
          suffix={`/ ${totalToday}`}
          hint={totalToday > 0 ? `${completedPct}% de la agenda de hoy` : "Todavía no hay turnos hoy"}
        />
        <StatCard label="Pagos pendientes" value={pendingPayments} hint="Turnos de hoy y anteriores sin cobrar" />
        <StatCard
          label="Horarios libres hoy"
          value={freeSlotsLeft}
          suffix={openSlots.length > 0 ? `/ ${openSlots.length}` : undefined}
          hint={
            todayAgenda.dayBlocked
              ? "El día está bloqueado"
              : todayAgenda.hasWorkingHours
                ? "Los que todavía quedan por delante"
                : "Hoy no hay horario de atención"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Turnos de hoy</h2>
              <Link href="/admin/turnos" className="text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            {totalToday === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay turnos para hoy.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Paciente</TableHead>
                      <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Hora</TableHead>
                      <TableHead className="hidden text-xs tracking-wide text-muted-foreground uppercase sm:table-cell">Tipo</TableHead>
                      <TableHead className="text-xs tracking-wide text-muted-foreground uppercase">Estado</TableHead>
                      <TableHead className="hidden text-xs tracking-wide text-muted-foreground uppercase md:table-cell">Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleToday.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={appointment.patient.name} />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/pacientes/${appointment.patient.id}`}
                                className="font-semibold underline-offset-2 hover:text-primary hover:underline"
                              >
                                {appointment.patient.name}
                              </Link>
                              <p className="text-xs text-muted-foreground">DNI {appointment.patient.dni}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{appointment.startTime} hs</TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {CONSULT_TYPE_LABEL[appointment.consultType]}
                        </TableCell>
                        <TableCell>
                          <AppointmentStatusPill status={appointment.status} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <PaymentStatusPill status={appointment.paymentStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {hiddenToday > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    y {hiddenToday} {hiddenToday === 1 ? "turno más" : "turnos más"} ·{" "}
                    <Link href="/admin/turnos" className="text-primary hover:underline">
                      ver la lista completa
                    </Link>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Capacidad de hoy</h2>
              <ProgressRow label="Turnos dados" done={totalToday} total={Math.max(openSlots.length, totalToday)} />
              <ProgressRow label="Atendidos" done={completedToday} total={totalToday} />
              <ProgressRow label="Cobrados" done={paidToday} total={totalToday} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Próximos turnos</h2>
                <Link href="/admin/turnos" className="text-sm text-primary hover:underline">
                  Ver más →
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No hay turnos próximos.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {upcoming.map((appointment) => (
                    <li key={appointment.id} className="flex items-center gap-3">
                      <Avatar name={appointment.patient.name} className="size-8 text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/pacientes/${appointment.patient.id}`}
                          className="block truncate text-sm font-medium hover:text-primary"
                        >
                          {appointment.patient.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDateISO(appointment.date) === formatDateISO(today)
                            ? "Hoy"
                            : `${WEEKDAYS_ES[appointment.date.getUTCDay()]} ${appointment.date.getUTCDate()}/${appointment.date.getUTCMonth() + 1}`}{" "}
                          · {appointment.startTime} hs
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Agenda del día</h2>
              <p className="text-sm text-muted-foreground">{formatDateLong(selectedDate)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin?date=${formatDateISO(addDays(selectedDate, -1))}`}
                aria-label="Día anterior"
                className={buttonVariants({ variant: "outline", size: "icon" })}
              >
                <ChevronLeft />
              </Link>
              <Link
                href="/admin"
                className={buttonVariants({ variant: selectedIsToday ? "secondary" : "outline", size: "default" })}
              >
                Hoy
              </Link>
              <Link
                href={`/admin?date=${formatDateISO(addDays(selectedDate, 1))}`}
                aria-label="Día siguiente"
                className={buttonVariants({ variant: "outline", size: "icon" })}
              >
                <ChevronRight />
              </Link>
            </div>
          </div>

          {agenda.dayBlocked && (
            <p className="rounded-lg border-l-2 border-amber-400 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Día bloqueado{agenda.dayBlocked.reason ? `: ${agenda.dayBlocked.reason}` : ""}.
            </p>
          )}

          {agenda.entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {agenda.hasWorkingHours ? "No hay horarios para este día." : "Este día no hay horario de atención configurado."}
            </p>
          ) : (
            <div className="gap-x-6 md:columns-2 xl:columns-3">
              {agenda.entries.map((entry, index) => (
                <div
                  key={`${entry.startTime}-${index}`}
                  className="mb-2 grid break-inside-avoid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2"
                >
                  <span className="text-sm text-muted-foreground">{entry.startTime}</span>
                  <AgendaSlot entry={entry} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
