"use client";

import { useActionState } from "react";

import { resetPasswordAction, type ResetPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ResetPasswordState = undefined;

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <ul className="list-disc pl-4 text-sm text-red-600">
            {state.errors.password.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Repetir contraseña</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-red-600">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Guardando..." : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
