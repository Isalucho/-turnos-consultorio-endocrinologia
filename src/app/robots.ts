import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/clinic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/turnos", "/login", "/registro", "/olvide-contrasena", "/restablecer-contrasena", "/api"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
