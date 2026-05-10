import type { MetadataRoute } from "next";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3600";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/api/", "/auth/", "/dashboard/", "/applications/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
