"use client";

import { markAppointmentPaidAction } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  defaultType: "PRIMERA" | "CONTROL";
};

export function PaymentForm({ id, defaultType }: Props) {
  const selectClass =
    "h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form action={markAppointmentPaidAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <select name="consultType" defaultValue={defaultType} className={selectClass} aria-label="Tipo de consulta">
        <option value="PRIMERA">Primera</option>
        <option value="CONTROL">Control</option>
      </select>
      <select name="method" defaultValue="" required className={selectClass} aria-label="Forma de pago">
        <option value="" disabled>
          Pago…
        </option>
        <option value="EFECTIVO">Efectivo</option>
        <option value="TRANSFERENCIA">Transferencia</option>
      </select>
      <Button type="submit" size="sm" variant="outline">
        Marcar pagado
      </Button>
    </form>
  );
}
