"use client";

import { useActionState } from "react";

import { adminBookAppointmentAction, type AdminBookState } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TimeSlot } from "@/lib/availability";

const initialState: AdminBookState = undefined;

type Props = {
  patientId: string;
  date: string;
  slots: TimeSlot[];
  hasEmail: boolean;
};

export function AdminBookForm({ patientId, date, slots, hasEmail }: Props) {
  const [state, formAction, pending] = useActionState(adminBookAppointmentAction, initialState);

  if (slots.length === 0) {
    return <p className="text-sm text-zinc-500">No hay horarios libres ese día. Probá con otra fecha.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="date" value={date} />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((slot) => (
          <label key={slot.startTime} className="cursor-pointer">
            <input type="radio" name="startTime" value={slot.startTime} required className="peer sr-only" />
            <span className="flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:font-medium peer-checked:text-emerald-700 hover:border-zinc-300">
              {slot.startTime}
            </span>
          </label>
        ))}
      </div>

      <Textarea name="reason" placeholder="Motivo de la consulta (opcional)" maxLength={300} />

      {hasEmail && (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="notify" defaultChecked className="size-4" />
          Enviar email de confirmación al paciente
        </label>
      )}

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Dar turno"}
      </Button>
    </form>
  );
}
