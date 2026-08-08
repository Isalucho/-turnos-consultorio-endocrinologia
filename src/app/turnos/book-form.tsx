"use client";

import { useActionState } from "react";

import { bookAppointmentAction, type BookState } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TimeSlot } from "@/lib/availability";

const initialState: BookState = undefined;

type Props = {
  date: string;
  slots: TimeSlot[];
  rescheduleId?: string;
};

export function BookForm({ date, slots, rescheduleId }: Props) {
  const [state, formAction, pending] = useActionState(bookAppointmentAction, initialState);

  if (slots.length === 0) {
    return <p className="text-sm text-zinc-500">No hay horarios disponibles ese día. Probá con otra fecha.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="date" value={date} />
      {rescheduleId && <input type="hidden" name="rescheduleId" value={rescheduleId} />}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Confirmando..." : rescheduleId ? "Confirmar reprogramación" : "Confirmar turno"}
      </Button>
    </form>
  );
}
