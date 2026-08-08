import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isPacienteRoute = nextUrl.pathname.startsWith("/turnos");

  if (isAdminRoute && (!isLoggedIn || role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isPacienteRoute && (!isLoggedIn || role !== "PACIENTE")) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // /login y /registro no redirigen automáticamente a un usuario ya logueado:
  // esas páginas muestran un aviso con opción de cerrar sesión en su lugar
  // (ver src/app/login/page.tsx y src/app/registro/page.tsx).
});

export const config = {
  matcher: ["/admin/:path*", "/turnos/:path*", "/login", "/registro"],
};
