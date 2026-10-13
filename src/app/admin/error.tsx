"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorScreen
      error={error}
      retry={retry}
      homeHref="/admin"
      homeLabel="Volver al panel"
      note="Si estabas escribiendo un registro de historia clínica, quedó guardado como borrador en este navegador: vas a verlo al volver a la ficha del paciente."
    />
  );
}
