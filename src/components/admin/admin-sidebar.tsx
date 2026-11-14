"use client";

import { CalendarDays, CalendarOff, Clock, LayoutDashboard, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/turnos", label: "Turnos", icon: CalendarDays },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/horarios", label: "Horarios", icon: Clock },
  { href: "/admin/bloqueos", label: "Bloqueos", icon: CalendarOff },
] as const;

/** Barra lateral en escritorio y barra inferior en celular. `children` es el botón de salir (server action). */
export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-sidebar-border bg-sidebar px-1",
        "md:sticky md:inset-auto md:top-0 md:h-screen md:w-22 md:shrink-0 md:flex-col md:justify-start md:gap-1.5 md:border-t-0 md:border-r md:px-2 md:py-5",
      )}
    >
      <Link
        href="/admin"
        aria-label="Inicio del panel"
        className="mb-3 hidden size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground md:flex"
      >
        <Plus className="size-5" strokeWidth={3} />
      </Link>

      <nav className="flex flex-1 items-center justify-around gap-1 md:w-full md:flex-none md:flex-col md:justify-start">
        {NAV_ITEMS.map((item) => {
          const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-14 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors md:w-full md:flex-none",
                active
                  ? "bg-sidebar-accent text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="md:mt-auto md:w-full">{children}</div>
    </aside>
  );
}
