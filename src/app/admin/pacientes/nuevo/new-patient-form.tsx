"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createPatientAction, type CreatePatientState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObraSocialField } from "@/components/obra-social-field";

const initialState: CreatePatientState = undefined;

export function NewPatientForm() {
  const [state, formAction, pending] = useActionState(createPatientAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre y apellido</Label>
        <Input id="name" name="name" placeholder="María Pérez" required autoFocus />
        {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" name="dni" inputMode="numeric" placeholder="30111222" required />
          {state?.errors?.dni && (
            <p className="text-sm text-red-600">
              {state.errors.dni[0]}{" "}
              {state.existingPatientId && (
                <Link href={`/admin/pacientes/${state.existingPatientId}`} className="underline">
                  Ver ficha
                </Link>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" placeholder="11 5555-5555" required />
          {state?.errors?.phone && <p className="text-sm text-red-600">{state.errors.phone[0]}</p>}
        </div>
      </div>

      <ObraSocialField />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email (opcional)</Label>
        <Input id="email" name="email" type="email" placeholder="maria@email.com" />
        <p className="text-xs text-zinc-500">
          Si lo cargás, el paciente puede activar su cuenta y recibir confirmaciones por mail.
        </p>
        {state?.errors?.email && (
          <p className="text-sm text-red-600">
            {state.errors.email[0]}{" "}
            {state.existingPatientId && (
              <Link href={`/admin/pacientes/${state.existingPatientId}`} className="underline">
                Ver ficha
              </Link>
            )}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar y dar turno"}
      </Button>
    </form>
  );
}
