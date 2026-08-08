"use client";

import { useActionState, useState } from "react";

import { addBlockedDateAction, type FormActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormActionState = undefined;

export function BlockedDateForm() {
  const [state, formAction, pending] = useActionState(addBlockedDateAction, initialState);
  const [fullDay, setFullDay] = useState(true);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Fecha</Label>
        <Input type="date" id="date" name="date" required />
      </div>

      <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="fullDay"
          checked={fullDay}
          onChange={(event) => setFullDay(event.target.checked)}
        />
        Día completo
      </label>

      {!fullDay && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="startTime">Desde</Label>
            <Input type="time" id="startTime" name="startTime" required={!fullDay} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="endTime">Hasta</Label>
            <Input type="time" id="endTime" name="endTime" required={!fullDay} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Input id="reason" name="reason" placeholder="Vacaciones, feriado..." className="w-56" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Agregando..." : "Bloquear"}
      </Button>

      {state?.message && <p className="w-full text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
