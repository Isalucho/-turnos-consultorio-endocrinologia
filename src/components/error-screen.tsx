"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
  note?: string;
};

export function ErrorScreen({ error, retry, homeHref = "/", homeLabel = "Ir al inicio", note }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Algo salió mal</h1>
        <p className="mt-3 text-zinc-600">
          No pudimos cargar esta página. Suele ser un problema momentáneo: probá de nuevo en unos segundos. Si sigue
          pasando, comunicate con el consultorio.
        </p>
        {note && <p className="mt-3 text-sm text-zinc-500">{note}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => retry()}>Reintentar</Button>
          <Link href={homeHref} className={buttonVariants({ variant: "outline" })}>
            {homeLabel}
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-zinc-400">Código de error: {error.digest}</p>}
      </div>
    </div>
  );
}
