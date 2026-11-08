import Link from "next/link";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clinic, getSiteUrl } from "@/lib/clinic";

export default async function Home() {
  const session = await auth();
  const ctaHref = session?.user
    ? session.user.role === "ADMIN"
      ? "/admin"
      : "/turnos"
    : "/registro";

  const hasContact = !!(clinic.address || clinic.phone);
  const jsonLd =
    clinic.doctor && clinic.address
      ? {
          "@context": "https://schema.org",
          "@type": "Physician",
          name: clinic.doctor,
          medicalSpecialty: "Endocrine",
          url: getSiteUrl(),
          ...(clinic.phone && { telephone: clinic.phone }),
          address: {
            "@type": "PostalAddress",
            streetAddress: clinic.address,
            ...(clinic.city && { addressLocality: clinic.city }),
            addressCountry: "AR",
          },
        }
      : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <div className="w-full max-w-2xl text-center">
        <p className="mb-2 text-sm font-medium text-emerald-700">
          {clinic.doctor ? `${clinic.doctor} · Endocrinología` : "Consultorio de Endocrinología"}
          {clinic.city ? ` · ${clinic.city}` : ""}
        </p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-zinc-900">
          Sacá tu turno online, sin llamadas ni esperas
        </h1>
        <p className="mb-8 text-lg text-zinc-600">
          Registrate, elegí el día y horario que más te convenga, y gestioná tus turnos desde
          cualquier lugar.
        </p>
        <p className="mb-8 text-base font-medium text-zinc-700">
          Atendemos todas las obras sociales.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={ctaHref} className={buttonVariants({ size: "lg" })}>
            {session?.user ? "Ir a mis turnos" : "Registrarme"}
          </Link>
          {!session?.user && (
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Ya tengo cuenta
            </Link>
          )}
        </div>
      </div>

      <div className="mt-16 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Registrate</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Creá tu cuenta con tus datos y los de tu obra social.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Elegí un horario</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Mirá los horarios disponibles y reservá el que prefieras.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Listo</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Recibís un email de confirmación y podés gestionarlo cuando quieras.</CardDescription>
          </CardContent>
        </Card>
      </div>

      {hasContact && (
        <div className="mt-10 w-full max-w-2xl rounded-xl border bg-white px-6 py-5 text-sm text-zinc-700">
          <h2 className="mb-2 font-semibold text-zinc-900">Dónde atendemos</h2>
          {clinic.address && (
            <p>
              {clinic.address}
              {clinic.city ? `, ${clinic.city}` : ""}
            </p>
          )}
          {clinic.phone && <p>Teléfono: {clinic.phone}</p>}
        </div>
      )}
    </div>
  );
}
