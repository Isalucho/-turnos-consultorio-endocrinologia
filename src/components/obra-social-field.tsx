"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OBRA_SOCIAL_OTRA, OBRAS_SOCIALES } from "@/lib/obras-sociales";

export function ObraSocialField({ label = "Obra social / prepaga (opcional)" }: { label?: string }) {
  const [obraSocial, setObraSocial] = useState("");
  const isOtra = obraSocial === OBRA_SOCIAL_OTRA;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="obraSocial">{label}</Label>
      <select
        id="obraSocial"
        value={obraSocial}
        onChange={(event) => setObraSocial(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      >
        <option value="">Sin especificar</option>
        {OBRAS_SOCIALES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={OBRA_SOCIAL_OTRA}>Otra</option>
      </select>
      {isOtra ? (
        <Input name="obraSocial" placeholder="Especificá cuál" autoFocus />
      ) : (
        <input type="hidden" name="obraSocial" value={obraSocial} />
      )}
    </div>
  );
}
