import { LogOut } from "lucide-react";

import { signOut } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/session";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="dark admin-theme flex flex-1 flex-col bg-background text-foreground md:flex-row">
      <AdminSidebar>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex w-full min-w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <LogOut className="size-5" />
            Salir
          </button>
        </form>
      </AdminSidebar>
      <main className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
