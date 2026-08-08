import { SiteHeader } from "@/components/site-header";
import { requirePaciente } from "@/lib/session";

export default async function TurnosLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePaciente();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <SiteHeader name={user.name ?? user.email ?? ""} role="PACIENTE" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
