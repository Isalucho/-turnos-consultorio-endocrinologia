"use client";

import { useActionState } from "react";

import { updatePricesAction, type PricesState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PricesState = undefined;

type Props = { firstConsultPrice: number; followUpPrice: number };

export function PricesForm({ firstConsultPrice, followUpPrice }: Props) {
  const [state, formAction, pending] = useActionState(updatePricesAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstConsultPrice">Primera consulta ($)</Label>
          <Input
            id="firstConsultPrice"
            name="firstConsultPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={firstConsultPrice}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="followUpPrice">Consultas de control ($)</Label>
          <Input
            id="followUpPrice"
            name="followUpPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={followUpPrice}
            required
          />
        </div>
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      {state?.savedAt && !state.message && <p className="text-sm text-emerald-700">Precios guardados.</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar precios"}
      </Button>
    </form>
  );
}
