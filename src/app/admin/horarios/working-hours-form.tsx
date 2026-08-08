"use client";

import { useActionState } from "react";

import { addWorkingHoursAction, type FormActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEEKDAYS_ES } from "@/lib/dates";

const initialState: FormActionState = undefined;

export function WorkingHoursForm() {
  const [state, formAction, pending] = useActionState(addWorkingHoursAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="dayOfWeek">Día</Label>
        <select
          id="dayOfWeek"
          name="dayOfWeek"
          defaultValue="1"
          className="h-8 w-36 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {WEEKDAYS_ES.map((label, index) => (
            <option key={index} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startTime">Desde</Label>
        <Input type="time" id="startTime" name="startTime" defaultValue="09:00" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="endTime">Hasta</Label>
        <Input type="time" id="endTime" name="endTime" defaultValue="13:00" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slotDurationMinutes">Duración (min)</Label>
        <Input
          type="number"
          id="slotDurationMinutes"
          name="slotDurationMinutes"
          defaultValue={30}
          min={5}
          max={240}
          step={5}
          className="w-24"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Agregando..." : "Agregar franja"}
      </Button>

      {state?.message && <p className="w-full text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
