"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  dateParam?: string;
  statusParam: string;
};

export function AppointmentFiltersForm({ dateParam, statusParam }: Props) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          type="date"
          id="date"
          name="date"
          defaultValue={dateParam}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Estado</Label>
        <select
          id="status"
          name="status"
          defaultValue={statusParam}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="CONFIRMED">Confirmados</option>
          <option value="CANCELLED">Cancelados</option>
          <option value="COMPLETED">Realizados</option>
          <option value="ALL">Todos</option>
        </select>
      </div>
      <Button type="submit" variant="outline">
        Filtrar
      </Button>
      {dateParam && (
        <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
          Limpiar fecha
        </Link>
      )}
    </form>
  );
}
