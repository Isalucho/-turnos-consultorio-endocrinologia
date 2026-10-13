import Link from "next/link";
import { notFound } from "next/navigation";

import { DateFilterForm } from "@/app/turnos/date-filter-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPOINTMENT_STATUS_BADGE_VARIANT, APPOINTMENT_STATUS_LABEL } from "@/lib/appointment-status";
import { getAvailableSlots } from "@/lib/availability";
import { formatDateISO, formatDateLong, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { prisma } from "@/lib/prisma";

import { deleteClinicalNoteAction, restoreClinicalNoteAction } from "../actions";
import { AdminBookForm } from "./admin-book-form";
import { ClinicalNoteForm } from "./clinical-note-form";
import { NoteFields, type NoteFieldsData } from "./note-fields";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatTimestamp(date: Date) {
  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function PatientDetailPage(props: PageProps<"/admin/pacientes/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const patient = await prisma.user.findUnique({ where: { id } });
  if (!patient || patient.role !== "PACIENTE") notFound();

  const today = todayDateOnly();
  const todayISO = formatDateISO(today);
  const dateParam = typeof searchParams.date === "string" ? searchParams.date : undefined;
  let selectedDateISO = todayISO;
  if (dateParam && ISO_DATE_RE.test(dateParam) && parseDateOnly(dateParam).getTime() >= today.getTime()) {
    selectedDateISO = dateParam;
  }
  const selectedDate = parseDateOnly(selectedDateISO);
  const slots = await getAvailableSlots(selectedDate);

  const justCreated = searchParams.nuevo === "1";
  const bookedTime = searchParams.turno === "ok" && typeof searchParams.hora === "string" ? searchParams.hora : null;

  const [allNotes, appointments] = await Promise.all([
    prisma.clinicalNote.findMany({
      where: { patientId: id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { revisions: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.appointment.findMany({
      where: { patientId: id },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    }),
  ]);
  const notes = allNotes.filter((note) => !note.deletedAt);
  const deletedNotes = allNotes.filter((note) => note.deletedAt);

  const editId = typeof searchParams.editar === "string" ? searchParams.editar : undefined;
  const editingNote = editId ? notes.find((note) => note.id === editId) : undefined;
  const justEdited = searchParams.editado === "1";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pacientes" className="text-sm text-zinc-500 underline-offset-2 hover:underline">
          ← Pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{patient.name}</h1>
        <p className="text-zinc-600">
          DNI {patient.dni} · {patient.phone}
          {patient.email && ` · ${patient.email}`}
        </p>
        {patient.obraSocial && <p className="text-zinc-600">Obra social: {patient.obraSocial}</p>}
      </div>

      {justCreated && (
        <Alert>
          <AlertTitle>Paciente creado</AlertTitle>
          <AlertDescription>Ya podés darle un turno abajo.</AlertDescription>
        </Alert>
      )}
      {justEdited && (
        <Alert>
          <AlertTitle>Registro actualizado</AlertTitle>
          <AlertDescription>La versión anterior quedó guardada en el historial del registro.</AlertDescription>
        </Alert>
      )}
      {bookedTime && (
        <Alert>
          <AlertTitle>Turno guardado</AlertTitle>
          <AlertDescription>
            {formatDateLong(selectedDate)} a las {bookedTime} hs. Podés agregar otro turno si hace falta.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dar turno</CardTitle>
          <CardDescription>Elegí el día y un horario libre.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DateFilterForm selectedDateISO={selectedDateISO} todayISO={todayISO} />
          <p className="text-sm font-medium text-zinc-900">{formatDateLong(selectedDate)}</p>
          <AdminBookForm
            key={selectedDateISO}
            patientId={patient.id}
            date={selectedDateISO}
            slots={slots}
            hasEmail={!!patient.email}
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Turnos</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-zinc-500">Este paciente todavía no sacó turnos.</p>
        ) : (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{formatDateLong(appointment.date)}</TableCell>
                      <TableCell>
                        {appointment.startTime} - {appointment.endTime}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-sm text-zinc-600">
                        {appointment.reason ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={APPOINTMENT_STATUS_BADGE_VARIANT[appointment.status]}>
                          {APPOINTMENT_STATUS_LABEL[appointment.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Card id="historia">
        <CardHeader>
          <CardTitle className="text-base">
            {editingNote ? `Editar registro del ${formatDateLong(editingNote.date)}` : "Agregar registro a la historia clínica"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicalNoteForm
            key={editingNote?.id ?? "nueva"}
            patientId={patient.id}
            note={
              editingNote
                ? {
                    id: editingNote.id,
                    version: editingNote.updatedAt.toISOString(),
                    values: {
                      date: formatDateISO(editingNote.date),
                      weightKg: editingNote.weightKg?.toString() ?? "",
                      bloodPressure: editingNote.bloodPressure ?? "",
                      diagnosis: editingNote.diagnosis ?? "",
                      treatment: editingNote.treatment ?? "",
                      labResults: editingNote.labResults ?? "",
                      notes: editingNote.notes ?? "",
                    },
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Historia clínica</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay registros para este paciente.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{formatDateLong(note.date)}</CardTitle>
                    {note.revisions.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500">Editado el {formatTimestamp(note.updatedAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/pacientes/${patient.id}?editar=${note.id}#historia`}
                      className={buttonVariants({ size: "sm", variant: "ghost" })}
                    >
                      Editar
                    </Link>
                    <form action={deleteClinicalNoteAction}>
                      <input type="hidden" name="id" value={note.id} />
                      <input type="hidden" name="patientId" value={patient.id} />
                      <ConfirmSubmitButton
                        size="sm"
                        variant="ghost"
                        confirmMessage="¿Eliminar este registro de la historia clínica? Se puede restaurar desde la sección Registros eliminados."
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <NoteFields data={note} />
                  {note.revisions.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-zinc-500">
                        Versiones anteriores ({note.revisions.length})
                      </summary>
                      <div className="mt-2 flex flex-col gap-3 border-l-2 border-zinc-200 pl-3">
                        {note.revisions.map((revision) => {
                          const snapshot = revision.snapshot as NoteFieldsData;
                          return (
                            <div key={revision.id}>
                              <p className="mb-1 text-xs text-zinc-500">
                                Versión reemplazada el {formatTimestamp(revision.createdAt)}
                              </p>
                              <NoteFields data={snapshot} />
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {deletedNotes.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-zinc-500">
            Registros eliminados ({deletedNotes.length})
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {deletedNotes.map((note) => (
              <Card key={note.id} className="opacity-80">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{formatDateLong(note.date)}</CardTitle>
                    <p className="mt-1 text-xs text-zinc-500">
                      Eliminado el {note.deletedAt ? formatTimestamp(note.deletedAt) : ""}
                    </p>
                  </div>
                  <form action={restoreClinicalNoteAction}>
                    <input type="hidden" name="id" value={note.id} />
                    <input type="hidden" name="patientId" value={patient.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Restaurar
                    </Button>
                  </form>
                </CardHeader>
                <CardContent>
                  <NoteFields data={note} />
                </CardContent>
              </Card>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
