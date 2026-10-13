"use client";

import "./globals.css";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Algo salió mal</h1>
          <p className="mt-3 text-zinc-600">
            No pudimos cargar el sitio. Probá de nuevo en unos segundos. Si sigue pasando, comunicate con el
            consultorio.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
          {error.digest && <p className="mt-6 text-xs text-zinc-400">Código de error: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
