"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction, type ForgotPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ForgotPasswordState = undefined;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state?.sent) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Si el email que ingresaste está registrado, te enviamos un link para restablecer tu
        contraseña. Revisá tu bandeja de entrada (y spam).
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="maria@email.com" required />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Enviando..." : "Enviar link de recuperación"}
      </Button>

      <p className="text-center text-sm text-zinc-600">
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
