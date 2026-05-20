import type { LandingPagePayload } from "@/lib/api/domains/landing-page/contract";

export const landingPageFallback: LandingPagePayload = {
  hero: {
    eyebrow: "Integracja gotowa na Laravel",
    title: "Buduj nowoczesny frontend",
    highlight: "szybciej i pewniej.",
    description:
      "Templatka gotowa do kodowania z AI. Next.js App Router, shadcn/ui, server-first components i kontekst przygotowany tak, zeby agent wiedzial, co robic od pierwszego prompta.",
    primary_cta_label: "Zacznij juz teraz",
    primary_cta_href: "#benefits",
    secondary_note:
      "Warstwa UI korzysta z server-first API helperow i moze przejsc na realny backend bez przebudowy widokow.",
  },
  features: [
    {
      id: "server-first",
      title: "Server-first components",
      body: "Dane pobierane po stronie serwera. Brak zbednego stanu po stronie klienta, szybszy czas ladowania i czystszy kod.",
    },
    {
      id: "shadcn",
      title: "shadcn/ui + Tailwind v4",
      body: "Gotowe prymitywy UI z pelna kontrola nad stylem. Bez naduzywan bibliotek, bez magii — tylko Twoj kod.",
    },
    {
      id: "ai-ready",
      title: "Zoptymalizowana pod AI",
      body: "Struktura projektu, konwencje i kontekst zaprojektowane tak, zeby agent wiedzial, co robic od pierwszego prompta.",
    },
  ],
  benefits: [
    "Dofinansowanie realizacji celow edukacyjnych i rozwoju osobistego",
    "Transparentny proces oceny wnioskow",
    "Mozliwosc skladania wnioskow przez ePUAP lub e-Doreczenia",
    "Dedykowane wsparcie na kazdym etapie procesu",
  ],
  stats: [
    { id: "support-level", value: "7000 zl", label: "Poziom wsparcia" },
    { id: "iterations", value: "1,500+", label: "Gotowych wdrozen i iteracji" },
    { id: "stack-status", value: "Server-first", label: "Gotowosc do integracji z backendem" },
  ],
};
