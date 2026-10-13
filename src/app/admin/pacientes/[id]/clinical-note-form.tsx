"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import {
  addClinicalNoteAction,
  updateClinicalNoteAction,
  type ClinicalNoteState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateISO, todayDateOnly } from "@/lib/dates";

type Values = {
  date: string;
  weightKg: string;
  bloodPressure: string;
  diagnosis: string;
  treatment: string;
  labResults: string;
  notes: string;
};

type Props = {
  patientId: string;
  /** Si viene, el formulario edita ese registro en vez de crear uno nuevo. */
  note?: { id: string; version: string; values: Values };
};

const emptyValues = (): Values => ({
  date: formatDateISO(todayDateOnly()),
  weightKg: "",
  bloodPressure: "",
  diagnosis: "",
  treatment: "",
  labResults: "",
  notes: "",
});

function readDraftRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseDraft(raw: string | null): Values | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Values;
  } catch {
    return null;
  }
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function writeDraft(key: string, values: Values | null) {
  try {
    if (values) window.localStorage.setItem(key, JSON.stringify(values));
    else window.localStorage.removeItem(key);
  } catch {
    // localStorage no disponible (modo privado, etc.): el formulario sigue funcionando sin borrador.
  }
}

export function ClinicalNoteForm({ patientId, note }: Props) {
  const isEdit = !!note;
  // La versión forma parte de la clave: después de guardar una edición, el borrador viejo deja de aplicar.
  const draftKey = note ? `nota-editar-${note.id}-${note.version}` : `nota-nueva-${patientId}`;
  const [initialValues] = useState<Values>(() => note?.values ?? emptyValues());

  // El borrador vive en localStorage; en el servidor no existe, por eso el snapshot de servidor es null.
  const storedDraft = useSyncExternalStore(
    subscribeToStorage,
    () => readDraftRaw(draftKey),
    () => null,
  );
  const draft = parseDraft(storedDraft);

  const [edits, setEdits] = useState<Values | null>(null);
  const [discarded, setDiscarded] = useState(false);

  const values = edits ?? (!discarded && draft ? draft : initialValues);
  const hasDraft = !discarded && !!draft;

  const [state, formAction, pending] = useActionState(
    async (previous: ClinicalNoteState, formData: FormData) => {
      const result = isEdit
        ? await updateClinicalNoteAction(previous, formData)
        : await addClinicalNoteAction(previous, formData);
      if (result?.savedAt) {
        writeDraft(draftKey, null);
        setEdits(emptyValues());
        setDiscarded(true);
        toast.success("Registro guardado en la historia clínica.");
      }
      return result;
    },
    undefined,
  );

  function update(field: keyof Values, value: string) {
    const next = { ...values, [field]: value };
    const changed = (Object.keys(next) as (keyof Values)[]).some((k) => next[k] !== initialValues[k]);
    writeDraft(draftKey, changed ? next : null);
    setEdits(next);
  }

  function discardDraft() {
    writeDraft(draftKey, null);
    setEdits(null);
    setDiscarded(true);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="patientId" value={patientId} />
      {note && <input type="hidden" name="noteId" value={note.id} />}

      {hasDraft && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>Hay un borrador sin guardar en este formulario (se conserva aunque cierres la página).</span>
          <button type="button" onClick={discardDraft} className="font-medium underline underline-offset-2">
            Descartar borrador
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            type="date"
            id="date"
            name="date"
            value={values.date}
            onChange={(e) => update("date", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weightKg">Peso (kg)</Label>
          <Input
            type="number"
            id="weightKg"
            name="weightKg"
            step="0.1"
            min="0"
            max="500"
            value={values.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bloodPressure">Presión arterial</Label>
          <Input
            id="bloodPressure"
            name="bloodPressure"
            placeholder="120/80"
            value={values.bloodPressure}
            onChange={(e) => update("bloodPressure", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea
          id="diagnosis"
          name="diagnosis"
          rows={2}
          value={values.diagnosis}
          onChange={(e) => update("diagnosis", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="treatment">Tratamiento indicado</Label>
        <Textarea
          id="treatment"
          name="treatment"
          rows={2}
          value={values.treatment}
          onChange={(e) => update("treatment", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="labResults">Resultados de laboratorio</Label>
        <Textarea
          id="labResults"
          name="labResults"
          rows={2}
          placeholder="Ej: TSH 2.1, T4 libre 1.3..."
          value={values.labResults}
          onChange={(e) => update("labResults", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar registro"}
        </Button>
        {isEdit && (
          <Link
            href={`/admin/pacientes/${patientId}`}
            className="text-sm text-zinc-500 underline underline-offset-2"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
