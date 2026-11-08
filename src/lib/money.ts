const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatARS(amount: number): string {
  return arsFormatter.format(amount);
}

export const CONSULT_TYPE_LABEL = { PRIMERA: "Primera consulta", CONTROL: "Control" } as const;
export const PAYMENT_METHOD_LABEL = { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia" } as const;
