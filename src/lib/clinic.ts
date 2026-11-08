// Datos públicos del consultorio. Vienen de variables de entorno para no publicar datos inventados:
// si una no está cargada, simplemente no se muestra.
const read = (value: string | undefined) => value?.trim() || null;

export const clinic = {
  doctor: read(process.env.CLINIC_DOCTOR),
  address: read(process.env.CLINIC_ADDRESS),
  city: read(process.env.CLINIC_CITY),
  phone: read(process.env.CLINIC_PHONE),
};

export function getSiteUrl(): string {
  const explicit = read(process.env.SITE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = read(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
