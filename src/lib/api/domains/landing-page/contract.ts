import type { ApiError } from "@/lib/api/contracts/common";

export type LandingPageTone = "blue" | "violet" | "emerald";

export type LandingPagePayload = {
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    primary_cta_label: string;
    primary_cta_href: string;
    secondary_note?: string;
  };
  features: Array<{
    id: string;
    title: string;
    body: string;
  }>;
  benefits: string[];
  stats: Array<{
    id: string;
    value: string;
    label: string;
  }>;
};

export type LandingPageContent = {
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryNote?: string;
  };
  features: Array<{
    id: string;
    title: string;
    body: string;
    tone: LandingPageTone;
  }>;
  benefits: string[];
  stats: Array<{
    id: string;
    value: string;
    label: string;
    tone: LandingPageTone;
  }>;
};

export type LandingPageContentResult = {
  content: LandingPageContent;
  source: "api" | "fallback";
  endpoint: string;
  error?: ApiError;
};
