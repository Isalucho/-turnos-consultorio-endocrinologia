import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage(props: PageProps<"/restablecer-contrasena">) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : undefined;

  const resetToken = token
    ? await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashPasswordResetToken(token) } })
    : null;

  const isValid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>Elegí una nueva contraseña para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          {isValid && token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>Este link venció o no es válido.</p>
              <Link href="/olvide-contrasena" className="mt-2 inline-block font-medium underline underline-offset-2">
                Pedir un link nuevo
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
