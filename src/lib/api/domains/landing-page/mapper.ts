import type {
  LandingPageContent,
  LandingPagePayload,
  LandingPageTone,
} from "@/lib/api/domains/landing-page/contract";

const featureTones = ["blue", "violet", "emerald"] as const;
const statTones: LandingPageTone[] = ["blue", "violet", "emerald"];

export function mapLandingPageContent(
  payload: LandingPagePayload,
): LandingPageContent {
  return {
    hero: {
      eyebrow: payload.hero.eyebrow,
      title: payload.hero.title,
      highlight: payload.hero.highlight,
      description: payload.hero.description,
      primaryCtaLabel: payload.hero.primary_cta_label,
      primaryCtaHref: payload.hero.primary_cta_href,
      secondaryNote: payload.hero.secondary_note,
    },
    features: payload.features.map((feature, index) => ({
      id: feature.id,
      title: feature.title,
      body: feature.body,
      tone: featureTones[index % featureTones.length],
    })),
    benefits: payload.benefits,
    stats: payload.stats.map((stat, index) => ({
      id: stat.id,
      value: stat.value,
      label: stat.label,
      tone: statTones[index % statTones.length],
    })),
  };
}
