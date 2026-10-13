import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-emerald-700">Error 404</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">No encontramos esta página</h1>
        <p className="mt-3 text-zinc-600">Puede que el link esté incompleto o que la página ya no exista.</p>
        <Link href="/" className={`${buttonVariants()} mt-6`}>
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
