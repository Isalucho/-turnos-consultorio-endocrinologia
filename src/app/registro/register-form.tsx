"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { registerAction, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OBRA_SOCIAL_OTRA, OBRAS_SOCIALES } from "@/lib/obras-sociales";

const initialState: RegisterState = undefined;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [obraSocial, setObraSocial] = useState("");
  const isOtra = obraSocial === OBRA_SOCIAL_OTRA;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre y apellido</Label>
        <Input id="name" name="name" placeholder="María Pérez" required />
        {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="maria@email.com" required />
        {state?.errors?.email && <p className="text-sm text-red-600">{state.errors.email[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" placeholder="11 5555-5555" required />
          {state?.errors?.phone && <p className="text-sm text-red-600">{state.errors.phone[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" name="dni" placeholder="30111222" required />
          {state?.errors?.dni && <p className="text-sm text-red-600">{state.errors.dni[0]}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="obraSocial">Obra social / prepaga (opcional)</Label>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <ul className="list-disc pl-4 text-sm text-red-600">
            {state.errors.password.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-zinc-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
