import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/clinic";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
