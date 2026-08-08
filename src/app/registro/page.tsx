import { auth } from "@/auth";
import { AlreadyLoggedInNotice } from "@/components/already-logged-in-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { RegisterForm } from "./register-form";

export default async function RegistroPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Registrate para poder sacar turnos.</CardDescription>
        </CardHeader>
        <CardContent>
          {session?.user ? (
            <AlreadyLoggedInNotice name={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
          ) : (
            <RegisterForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
