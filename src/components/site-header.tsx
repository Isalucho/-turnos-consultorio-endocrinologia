import Link from "next/link";

import { signOut } from "@/auth";

type Props = {
  name: string;
  role: "PACIENTE" | "ADMIN";
};

export function SiteHeader({ name, role }: Props) {
  const homeHref = role === "ADMIN" ? "/admin" : "/turnos";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={homeHref} className="font-semibold text-zinc-900">
          Consultorio de Endocrinología
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {role === "PACIENTE" && (
            <>
              <Link href="/turnos" className="text-zinc-600 hover:text-zinc-900">
                Sacar turno
              </Link>
              <Link href="/turnos/mis-turnos" className="text-zinc-600 hover:text-zinc-900">
                Mis turnos
              </Link>
            </>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
                Turnos
              </Link>
              <Link href="/admin/horarios" className="text-zinc-600 hover:text-zinc-900">
                Horarios
              </Link>
              <Link href="/admin/bloqueos" className="text-zinc-600 hover:text-zinc-900">
                Bloqueos
              </Link>
              <Link href="/admin/pacientes" className="text-zinc-600 hover:text-zinc-900">
                Pacientes
              </Link>
            </>
          )}
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500">{name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
              Salir
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
