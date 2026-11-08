import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { clinic, getSiteUrl } from "@/lib/clinic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const where = clinic.city ? ` en ${clinic.city}` : "";
const siteName = clinic.doctor ? `${clinic.doctor} · Endocrinología` : "Consultorio de Endocrinología";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${siteName} | Turnos online`, template: `%s | ${siteName}` },
  description: `Sacá o gestioná tu turno online con la endocrinóloga${where}. Elegí día y horario sin llamadas ni esperas.`,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName,
    title: `${siteName} | Turnos online`,
    description: `Sacá tu turno online con la endocrinóloga${where}.`,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
