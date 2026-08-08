import { SiteHeader } from "@/components/site-header";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <SiteHeader name={user.name ?? user.email ?? ""} role="ADMIN" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
