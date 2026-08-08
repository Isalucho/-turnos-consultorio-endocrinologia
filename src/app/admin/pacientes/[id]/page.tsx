import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLong } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

import { deleteClinicalNoteAction } from "../actions";
import { ClinicalNoteForm } from "./clinical-note-form";

export default async function PatientDetailPage(props: PageProps<"/admin/pacientes/[id]">) {
  const { id } = await props.params;

  const patient = await prisma.user.findUnique({ where: { id } });
  if (!patient || patient.role !== "PACIENTE") notFound();

  const notes = await prisma.clinicalNote.findMany({
    where: { patientId: id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pacientes" className="text-sm text-zinc-500 underline-offset-2 hover:underline">
          ← Pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{patient.name}</h1>
        <p className="text-zinc-600">
          DNI {patient.dni} · {patient.email} · {patient.phone}
        </p>
        {patient.obraSocial && <p className="text-zinc-600">Obra social: {patient.obraSocial}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar registro a la historia clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicalNoteForm patientId={patient.id} />
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{formatDateLong(note.date)}</CardTitle>
                  <form action={deleteClinicalNoteAction}>
                    <input type="hidden" name="id" value={note.id} />
                    <input type="hidden" name="patientId" value={patient.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Eliminar
                    </Button>
                  </form>
                </CardHeader>
                {(note.weightKg || note.bloodPressure || note.diagnosis || note.treatment || note.labResults || note.notes) && (
                  <CardContent className="flex flex-col gap-1 text-sm text-zinc-700">
                    {(note.weightKg || note.bloodPressure) && (
                      <p>
                        {note.weightKg && <>Peso: {note.weightKg} kg</>}
                        {note.weightKg && note.bloodPressure && " · "}
                        {note.bloodPressure && <>Presión: {note.bloodPressure}</>}
                      </p>
                    )}
                    {note.diagnosis && (
                      <p>
                        <strong>Diagnóstico:</strong> {note.diagnosis}
                      </p>
                    )}
                    {note.treatment && (
                      <p>
                        <strong>Tratamiento:</strong> {note.treatment}
                      </p>
                    )}
                    {note.labResults && (
                      <p>
                        <strong>Laboratorio:</strong> {note.labResults}
                      </p>
                    )}
                    {note.notes && (
                      <p>
                        <strong>Notas:</strong> {note.notes}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
