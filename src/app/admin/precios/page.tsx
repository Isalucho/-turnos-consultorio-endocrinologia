import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrices } from "@/lib/prices";

import { PricesForm } from "./prices-form";

export default async function PreciosPage() {
  const prices = await getPrices();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Precios de consulta</h1>
        <p className="text-zinc-600">
          Se usan para sugerir el monto al cobrar cada turno. Si los cambiás, los turnos ya cobrados conservan el monto
          que se cobró en su momento.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Valores vigentes</CardTitle>
          <CardDescription>Montos en pesos argentinos, sin puntos ni comas.</CardDescription>
        </CardHeader>
        <CardContent>
          <PricesForm firstConsultPrice={prices.firstConsultPrice} followUpPrice={prices.followUpPrice} />
        </CardContent>
      </Card>
    </div>
  );
}
