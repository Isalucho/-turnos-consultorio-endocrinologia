"use client";

import { useState } from "react";

import { markAppointmentPaidAction } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  defaultType: "PRIMERA" | "CONTROL";
  firstConsultPrice: number;
  followUpPrice: number;
};

export function PaymentForm({ id, defaultType, firstConsultPrice, followUpPrice }: Props) {
  const priceOf = (type: "PRIMERA" | "CONTROL") => (type === "PRIMERA" ? firstConsultPrice : followUpPrice);
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState(String(priceOf(defaultType)));

  const selectClass =
    "h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form action={markAppointmentPaidAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <select
        name="consultType"
        value={type}
        onChange={(event) => {
          const next = event.target.value as "PRIMERA" | "CONTROL";
          setType(next);
          setAmount(String(priceOf(next)));
        }}
        className={selectClass}
        aria-label="Tipo de consulta"
      >
        <option value="PRIMERA">Primera</option>
        <option value="CONTROL">Control</option>
      </select>
      <input
        name="amount"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className={`${selectClass} w-24`}
        aria-label="Monto cobrado"
        required
      />
      <select name="method" defaultValue="" required className={selectClass} aria-label="Forma de pago">
        <option value="" disabled>
          Pago…
        </option>
        <option value="EFECTIVO">Efectivo</option>
        <option value="TRANSFERENCIA">Transferencia</option>
      </select>
      <Button type="submit" size="sm" variant="outline">
        Cobrar
      </Button>
    </form>
  );
}
