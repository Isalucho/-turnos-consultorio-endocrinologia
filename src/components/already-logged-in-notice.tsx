import Link from "next/link";

import { signOut } from "@/auth";

type Props = {
  name: string;
  role: "PACIENTE" | "ADMIN";
};

export function AlreadyLoggedInNotice({ name, role }: Props) {
  const homeHref = role === "ADMIN" ? "/admin" : "/turnos";

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        Ya iniciaste sesión como <strong>{name}</strong>
        {role === "ADMIN" ? " (administración)" : ""}.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Link href={homeHref} className="font-medium underline underline-offset-2">
          {role === "ADMIN" ? "Ir al panel" : "Ir a mis turnos"}
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="font-medium underline underline-offset-2">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
