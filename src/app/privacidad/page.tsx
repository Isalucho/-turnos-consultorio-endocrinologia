import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Política de privacidad | Consultorio de Endocrinología",
};

export default function PrivacidadPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Política de privacidad</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-sm leading-6 text-zinc-700">
            <p>
              Esta política explica qué datos recolectamos a través de este sitio, para qué los
              usamos y qué derechos tenés sobre ellos, en línea con la Ley 25.326 de Protección de
              los Datos Personales.
            </p>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-zinc-900">Qué datos recolectamos</h2>
              <ul className="list-disc pl-5">
                <li>Datos de contacto y de identificación: nombre, email, teléfono, DNI y obra social.</li>
                <li>Datos de tus turnos: fechas, horarios y motivo de consulta.</li>
                <li>
                  Datos de salud que la médica carga en tu historia clínica (peso, presión, diagnóstico,
                  tratamiento y resultados de laboratorio). Estos son <strong>datos sensibles</strong> y
                  reciben un nivel de protección más estricto.
                </li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-zinc-900">Para qué los usamos</h2>
              <ul className="list-disc pl-5">
                <li>Gestionar tu cuenta y tus turnos (reservar, cancelar, reprogramar).</li>
                <li>Enviarte emails de confirmación, cancelación o reprogramación de turnos.</li>
                <li>Llevar tu historia clínica, accesible únicamente por la profesional a cargo del consultorio.</li>
              </ul>
              <p>No usamos tus datos con fines publicitarios ni los vendemos ni cedemos a terceros.</p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-zinc-900">Quién accede a tus datos</h2>
              <p>
                Tus datos de contacto y turnos son visibles para la administración del consultorio. Tu
                historia clínica es visible únicamente para la profesional (rol administrador). Los
                datos se almacenan en proveedores de infraestructura (hosting y base de datos) que
                actúan como encargados del tratamiento, sin acceder al contenido salvo para el
                mantenimiento técnico del servicio.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-zinc-900">Tus derechos</h2>
              <p>
                Podés pedir acceder, rectificar o eliminar tus datos personales en cualquier momento
                escribiéndole directamente a la administración del consultorio. La Agencia de Acceso a
                la Información Pública, como órgano de control de la Ley 25.326, es la autoridad ante
                la cual también podés hacer reclamos.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-zinc-900">Conservación</h2>
              <p>
                Conservamos tus datos mientras mantengas una cuenta activa en el sistema, y luego por
                el plazo que exija la normativa aplicable a la conservación de historias clínicas.
              </p>
            </section>

            <Link href="/registro" className="font-medium text-emerald-700 hover:underline">
              Volver al registro
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
