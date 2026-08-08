"use client";

import { useActionState } from "react";

import { addClinicalNoteAction, type ClinicalNoteState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateISO, todayDateOnly } from "@/lib/dates";

const initialState: ClinicalNoteState = undefined;

export function ClinicalNoteForm({ patientId }: { patientId: string }) {
  const [state, formAction, pending] = useActionState(addClinicalNoteAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="patientId" value={patientId} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Fecha</Label>
          <Input type="date" id="date" name="date" defaultValue={formatDateISO(todayDateOnly())} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weightKg">Peso (kg)</Label>
          <Input type="number" id="weightKg" name="weightKg" step="0.1" min="0" max="500" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bloodPressure">Presión arterial</Label>
          <Input id="bloodPressure" name="bloodPressure" placeholder="120/80" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea id="diagnosis" name="diagnosis" rows={2} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="treatment">Tratamiento indicado</Label>
        <Textarea id="treatment" name="treatment" rows={2} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="labResults">Resultados de laboratorio</Label>
        <Textarea id="labResults" name="labResults" rows={2} placeholder="Ej: TSH 2.1, T4 libre 1.3..." />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Agregar registro"}
      </Button>
    </form>
  );
}
