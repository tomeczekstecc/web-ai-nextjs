import type { LandingPagePayload } from "@/lib/api/domains/landing-page/contract";

export const landingPageFallback: LandingPagePayload = {
  hero: {
    eyebrow: "Production-ready · Next.js 16 + React 19",
    title: "Kompletna platforma aplikacyjna",
    highlight: "gotowa na wdrożenie.",
    description:
      "RBAC, Wizard, DataTable z 14 funkcjami, File Uploader, Dashboard — wszystko zintegrowane, przetestowane i gotowe do podpięcia pod backend Laravel.",
    primary_cta_label: "Otwórz aplikację",
    primary_cta_href: "/dashboard",
    secondary_note:
      "Zmień API_URL, aby podpiąć realny backend — bez zmian w komponentach.",
  },
  features: [
    {
      id: "auth-rbac",
      title: "Auth + RBAC end-to-end",
      body: "Better-Auth z social login, rate limitingiem i audit logiem. 4-warstwowy RBAC: server gate, action wrapper, menu filter i client <RoleGate> — izomorficzny Principal między warstwami.",
    },
    {
      id: "wizard-datatable",
      title: "Wizard · DataTable · Upload",
      body: "Generyczny silnik wielokrokowych formularzy (create/edit/view), DataTable z eksportem XLSX i drag & drop reorder, File Uploader z kolejką, metadanymi i XHR progress.",
    },
    {
      id: "ddd-server-first",
      title: "Server-first + DDD + MSW",
      body: "Next.js App Router z Server Components, lite DDD (queries/commands/mapper), React.cache per-request memoization, Zustand slices, TanStack Query i MSW mocks dla developmentu bez backendu.",
    },
  ],
  benefits: [
    "RBAC w 4 warstwach — od server action do przycisku w UI",
    "Wizard z walidacją per-krok i trybami create / edit / view",
    "DataTable z 14 funkcjami: DnD, XLSX, persystencja, bulk actions",
    "File Uploader z drag & drop, kolejką i metadanymi per plik",
    "Dashboard z Recharts, drawer responsywny i KPI cards",
    "Dark / Light mode, Sonner toasts, destructive pattern",
    "Dostępność: ARIA, keyboard nav, semantic HTML, screen-reader safe",
    "Monaco Editor, DualListTransfer, FormRepeater, TableRepeater",
  ],
  stats: [
    { id: "routes",     value: "20+",  label: "Tras i widoków" },
    { id: "rbac",       value: "4",    label: "Warstwy RBAC" },
    { id: "datatable",  value: "14",   label: "Funkcji DataTable" },
    { id: "domains",    value: "6",    label: "Domen API" },
  ],
};
