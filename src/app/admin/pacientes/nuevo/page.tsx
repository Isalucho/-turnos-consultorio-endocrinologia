import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NewPatientForm } from "./new-patient-form";

export default function NewPatientPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pacientes" className="text-sm text-zinc-500 underline-offset-2 hover:underline">
          ← Pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Nuevo paciente</h1>
        <p className="text-zinc-600">Cargá los datos básicos. Después de guardar vas a poder darle un turno.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <NewPatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
