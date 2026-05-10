import type { MetadataRoute } from "next";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3600";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
