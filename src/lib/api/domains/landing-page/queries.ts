import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import type {
  LandingPageContentResult,
  LandingPagePayload,
} from "@/lib/api/domains/landing-page/contract";
import { mapLandingPageContent } from "@/lib/api/domains/landing-page/mapper";
import { landingPageFallback } from "@/mocks/data/landing-page";

const endpoint = "/api/public/landing-page";

const fallbackContent = mapLandingPageContent(landingPageFallback);

export async function getLandingPageContent(): Promise<LandingPageContentResult> {
  const result = await apiRequest<LandingPagePayload>({
    path: endpoint,
    method: "GET",
  });

  if (result.ok) {
    return {
      content: mapLandingPageContent(result.data),
      source: "api",
      endpoint,
    };
  }

  return {
    content: fallbackContent,
    source: "fallback",
    endpoint,
    error: result.error,
  };
}
