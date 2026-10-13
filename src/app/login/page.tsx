import { auth } from "@/auth";
import { AlreadyLoggedInNotice } from "@/components/already-logged-in-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const justReset = searchParams.restablecida === "1";

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresá con tu email y contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {justReset && !session?.user && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Tu contraseña se actualizó. Ya podés iniciar sesión.
            </div>
          )}
          {session?.user ? (
            <AlreadyLoggedInNotice name={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
          ) : (
            <LoginForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
