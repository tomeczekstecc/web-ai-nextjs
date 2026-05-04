import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import type {
  LandingPageContentResult,
  LandingPagePayload,
} from "@/lib/api/domains/landing-page/contract";
import { mapLandingPageContent } from "@/lib/api/domains/landing-page/mapper";

const endpoint = "/api/public/landing-page";

const fallbackPayload: LandingPagePayload = {
  hero: {
    eyebrow: "Integracja gotowa na Laravel",
    title: "Buduj nowoczesny frontend",
    highlight: "szybciej i pewniej.",
    description:
      "Minimalny, elegancki punkt startowy dla produktu w Next.js. Przejrzysty hero, mocne CTA i spokojny uklad gotowy do dalszej rozbudowy oraz integracji z Laravel.",
    primary_cta_label: "Zacznij juz teraz",
    primary_cta_href: "#benefits",
    secondary_note:
      "Warstwa UI korzysta z server-first API helperow i moze przejsc na realny backend bez przebudowy widokow.",
  },
  features: [
    {
      id: "process",
      title: "Prosty proces",
      body: "Jasny formularz i przejrzysta sciezka przejscia od informacji do dzialania.",
    },
    {
      id: "verification",
      title: "Szybka weryfikacja",
      body: "Minimum tarcia i czytelne kroki, dzieki ktorym uzytkownik wie, co dalej.",
    },
    {
      id: "support",
      title: "Pelne wsparcie",
      body: "Interfejs, ktory prowadzi spokojnie i nie zasypuje zbednymi decyzjami.",
    },
  ],
  benefits: [
    "Dofinansowanie realizacji celow edukacyjnych i rozwoju osobistego",
    "Transparentny proces oceny wnioskow",
    "Mozliwosc skladania wnioskow przez ePUAP lub e-Doreczenia",
    "Dedykowane wsparcie na kazdym etapie procesu",
  ],
  stats: [
    {
      id: "support-level",
      value: "7000 zl",
      label: "Poziom wsparcia",
    },
    {
      id: "iterations",
      value: "1,500+",
      label: "Gotowych wdrozen i iteracji",
    },
    {
      id: "stack-status",
      value: "Server-first",
      label: "Gotowosc do integracji z backendem",
    },
  ],
};

const fallbackContent = mapLandingPageContent(fallbackPayload);

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
