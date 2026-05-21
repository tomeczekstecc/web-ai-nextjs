import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3600";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/api/", "/auth/", "/dashboard/", "/applications/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
