import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  GitBranch,
  Globe,
  GraduationCap,
  PlayCircle,
  KeyRound,
  LayoutList,
  ListOrdered,
  ShieldCheck,
  Table2,
  Upload,
  Zap,
  Layers,
  Eye,
  Database,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config/app";
import { getLandingPageContent } from "@/lib/api/domains/landing-page/queries";

const _description =
  "Kompletna platforma aplikacyjna: RBAC w 4 warstwach, Wizard, DataTable z 14 funkcjami, File Uploader - zintegrowane i gotowe na wdrożenie.";

export const metadata: Metadata = {
  title: `${appConfig.name} - Web Platform`,
  description: _description,
  openGraph: {
    title: `${appConfig.name} - Web Platform`,
    description: _description,
  },
  twitter: {
    title: `${appConfig.name} - Web Platform`,
    description: _description,
  },
};

export const dynamic = "force-dynamic";

// ── Static feature catalog ──────────────────────────────────────────────────

const featureCategories = [
  {
    Icon: KeyRound,
    title: "Uwierzytelnianie",
    subtitle: "Better-Auth · Laravel bridge",
    items: [
      "Logowanie, rejestracja, reset hasła",
      "Weryfikacja e-mail z auto-polling tokenu",
      "Social Login: Google / Apple / Facebook",
      "Rate limiting + JSON audit log",
      "returnTo po zalogowaniu - bez open redirect",
      "Dev mock bypass (brak potrzeby konta lokalnie)",
    ],
  },
  {
    Icon: ShieldCheck,
    title: "RBAC - 4 warstwy",
    subtitle: "Role + uprawnienia end-to-end",
    items: [
      "requireRole() - gate w layoucie i stronie",
      "withRole() - każda server action chroniona",
      "Menu filter - sidebar filtrowany per rola",
      "<RoleGate> / <PermissionGate> - cichy client gate",
      "<AuthorizedView> - fallback z komunikatem",
      "Izomorficzny Principal: serwer ↔ klient",
    ],
  },
  {
    Icon: ListOrdered,
    title: "Wizard",
    subtitle: "Generyczny silnik wieloetapowych formularzy",
    items: [
      "Pasek postępu z ikonami błędów per krok",
      "Tryby: create / edit / view",
      "Save-on-page-change, custom CTA actions",
      "Ładowanie i zapis danych przez API",
      "6-krokowy wizard zadań",
      "3-krokowy wizard raportów + Monaco SQL editor",
    ],
  },
  {
    Icon: Table2,
    title: "DataTable",
    subtitle: "14 wbudowanych funkcji · TanStack Table v8",
    items: [
      "Sortowanie, filtrowanie kolumn, wyszukiwanie",
      "Paginacja client + server-side",
      "Drag & Drop reorder - klawiatura, dotyk, mysz",
      "Eksport XLSX - serwer, ExcelJS, server-only",
      "Persystencja preferencji w localStorage",
      "Bulk actions, skeleton, toolbar slots",
    ],
  },
  {
    Icon: LayoutList,
    title: "Zaawansowane formularze",
    subtitle: "TanStack Form v1 · Zod v4",
    items: [
      "FormRepeater - karta per wiersz, reorder",
      "TableRepeater - tabela z nagłówkami kolumn",
      "DualListTransfer - transfer list z wyszukiwaniem",
      "Field system - label, description, error + ARIA",
      "Wizard inputs: Input, Select, Radio, DateTime",
      "Walidacja StandardSchema / Zod per krok",
    ],
  },
  {
    Icon: Upload,
    title: "File Uploader",
    subtitle: "Drag & drop · kolejka · repozytorium",
    items: [
      "Strefa drag & drop (react-dropzone)",
      "Kolejka z metadanymi per plik",
      "XHR progress, edit dialog, delete dialog",
      "Read-only mode, canMutateRow per plik",
      "TanStack mutations z optimistic UI",
      "Adapter pattern - podpinasz własne API",
    ],
  },
] as const;

const dtFeatures = [
  "Sortowanie wielokolumnowe (klikalne nagłówki)",
  "Filtrowanie per kolumna (popover z unikalnymi wartościami)",
  "Wyszukiwanie client-side i server-side (manual mode)",
  "Paginacja client + server (pageCount, rowCount dla totali)",
  "Zaznaczanie wierszy - single, multi, select all",
  "Drag & Drop reorder - @dnd-kit, klawiatura + dotyk",
  "Widoczność kolumn - toggle-menu w toolbarze",
  "Export XLSX przez /api/internal/excel-export",
  "Persystencja preferencji w localStorage per route",
  "Skeleton loading state (<DataTableSkeleton>)",
  "Toolbar ze slotami left / right / selectionContent",
  "Bulk actions - masowe usuwanie i operacje",
  "Error state z przyciskiem 'Spróbuj ponownie'",
  "Column filter popover + SortableHeader komponent",
] as const;

const rbacLayers = [
  {
    num: "01",
    name: "Server Gate",
    api: "requireRole() · requirePermission()",
    where: "Layouty i strony (Server Components)",
    desc: "Rzuca unauthorized() (401) lub forbidden() (403) zanim strona się wyrenderuje.",
  },
  {
    num: "02",
    name: "Action Gate",
    api: "withRole() · withPermission()",
    where: "Server Actions",
    desc: "Opakowuje każdą server action - endpoint chroniony niezależnie od UI.",
  },
  {
    num: "03",
    name: "Menu Filter",
    api: "filterFeatures() · filterSettings()",
    where: "Sidebar i nawigacja",
    desc: "Menu ładowane z API filtrowane po stronie klienta na podstawie ról.",
  },
  {
    num: "04",
    name: "Client Gate",
    api: "<RoleGate> · <PermissionGate> · <AuthorizedView>",
    where: "Komponenty UI",
    desc: "Ukrywa przyciski, sekcje lub całe widoki. Zawsze powiązany z serwerową ochroną.",
  },
] as const;

const componentTags = [
  "Wizard", "WizardProvider", "WizardSummary",
  "DataTable", "DataTableSkeleton", "DataTableToolbar",
  "FormRepeater", "TableRepeater", "DualListTransfer",
  "Uploader", "DropzoneArea", "QueueList", "RepositoryList",
  "RoleGate", "PermissionGate", "AuthorizedView", "PrincipalProvider",
  "CopyButton", "RelativeTime", "ThemeToggle",
  "AppSidebar", "AppDrawer", "BreadcrumbBar", "SectionCards",
  "DashboardActivityChart", "TableCellViewer",
  "Field", "FieldLabel", "FieldError", "FieldGroup",
  "Button", "Badge", "Dialog", "Sheet", "Drawer",
  "Tabs", "Calendar", "Popover", "Alert", "Skeleton",
  "Toast (Sonner)", "Tooltip", "Separator",
] as const;

const stackItems = [
  { label: "Next.js",        version: "v16",  category: "Framework" },
  { label: "React",          version: "v19",  category: "UI Runtime" },
  { label: "TypeScript",     version: "v5.8", category: "Language" },
  { label: "Tailwind CSS",   version: "v4",   category: "Styling" },
  { label: "shadcn/ui",      version: "nova", category: "Components" },
  { label: "TanStack Query", version: "v5",   category: "Server State" },
  { label: "TanStack Table", version: "v8",   category: "Tables" },
  { label: "TanStack Form",  version: "v1",   category: "Forms" },
  { label: "Zod",            version: "v4",   category: "Validation" },
  { label: "Zustand",        version: "v5",   category: "Client State" },
  { label: "Better-Auth",    version: "v1.3", category: "Auth" },
  { label: "dnd kit",        version: "v6",   category: "Drag & Drop" },
  { label: "Recharts",       version: "v3",   category: "Charts" },
  { label: "ExcelJS",        version: "v4",   category: "XLSX Export" },
  { label: "Monaco Editor",  version: "v4",   category: "Code Editor" },
  { label: "MSW",            version: "v2",   category: "API Mocking" },
] as const;

// ── Page ────────────────────────────────────────────────────────────────────

export default async function Home() {
  const { content, source } = await getLandingPageContent();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">

      {/* Background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="landing-blob absolute -left-56 -top-56 size-[700px] bg-blue-300/10 dark:bg-blue-800/10"
          style={{ "--blob-duration": "26s" } as React.CSSProperties}
        />
        <div
          className="landing-blob absolute -right-48 -top-20 size-[580px] bg-violet-300/8 dark:bg-violet-800/8"
          style={{ "--blob-duration": "32s", "--blob-delay": "-10s" } as React.CSSProperties}
        />
        <div
          className="landing-blob absolute -bottom-48 left-1/2 size-[540px] -translate-x-1/2 bg-sky-200/10 dark:bg-indigo-900/15"
          style={{ "--blob-duration": "21s", "--blob-delay": "-17s" } as React.CSSProperties}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-4 sm:px-8">

        {/* ── Header ── */}
        <header className="flex items-center justify-between py-2">
          <p className="text-base font-semibold tracking-tight">{appConfig.name}</p>
          <ThemeToggle />
        </header>

        {/* ── Hero ── */}
        <section className="grid items-start gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-14">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="outline" className="rounded-full px-4 py-1.5 text-xs font-medium">
              {source === "api" ? "🟢 Backend online" : "⚡ Tryb lokalny"} · {content.hero.eyebrow}
            </Badge>

            <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {content.hero.title}{" "}
              <span className="text-muted-foreground">{content.hero.highlight}</span>
            </h1>

            <p className="max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
              {content.hero.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                className="h-11 rounded-xl px-6"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                {content.hero.primaryCtaLabel}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-xl px-6"
                nativeButton={false}
                render={<Link href="#features" />}
              >
                Przeglądaj funkcje
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="#" />}>
                <GitBranch className="size-4" />
                GitLab
              </Button>

              <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nauka
              </span>

              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href="https://ci-prs.udemy.com/course/nextjs-react-the-complete-guide/learn/lecture/41160682#overview"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <GraduationCap className="size-4" />
                Next.js
              </Button>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href="https://ci-prs.udemy.com/course/react-typescript-the-practical-guide/"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <GraduationCap className="size-4" />
                TypeScript
              </Button>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href="https://www.youtube.com/watch?v=6tEQ1nJZ51w&t=1s"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <PlayCircle className="size-4" />
                Zustand
              </Button>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href="https://ci-prs.udemy.com/course/react-tutorial-and-projects-course/"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <GraduationCap className="size-4" />
                shadcn/ui
              </Button>
            </div>
          </div>

          <aside
            aria-label="Migawka platformy"
            className="hidden rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur lg:block"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Platforma
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Gotowe moduły
                </h2>
              </div>
              <Badge variant="outline" className="rounded-full">
                live
              </Badge>
            </div>

            <div className="space-y-3">
              {[
                { Icon: ShieldCheck, label: "RBAC", detail: "4 warstwy ochrony" },
                { Icon: ListOrdered, label: "Wizard", detail: "tryby create, edit, view" },
                { Icon: Table2, label: "DataTable", detail: "14 funkcji operacyjnych" },
                { Icon: Upload, label: "Uploader", detail: "kolejka i repozytorium" },
              ].map(({ Icon, label, detail }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border bg-background px-3 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">{detail}</p>
                  </div>
                  <CheckCircle2 className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
              {content.stats.slice(1, 4).map((stat) => (
                <div key={stat.id} className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-lg font-bold leading-none tracking-tight">{stat.value}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {/* ── Stats bar ── */}
        <section
          aria-label="Statystyki platformy"
          className="mb-20 grid grid-cols-2 gap-3 border-t pt-10 sm:grid-cols-4"
        >
          {content.stats.map((stat) => (
            <div
              key={stat.id}
              className="flex flex-col gap-1 rounded-2xl border bg-card px-5 py-4 shadow-sm"
            >
              <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </section>

        {/* ── Feature categories ── */}
        <section id="features" className="mb-20 scroll-mt-8">
          <div className="mb-8">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Funkcjonalności
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Wszystko czego potrzebujesz,{" "}
              <span className="text-muted-foreground">już gotowe.</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCategories.map(({ Icon, title, subtitle, items }) => (
              <article
                key={title}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-snug">{title}</h3>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ── DataTable deep-dive ── */}
        <section className="mb-20">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                <Table2 className="size-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-snug">DataTable - 14 funkcji w jednym komponencie</h2>
                <p className="text-sm text-muted-foreground">
                  TanStack Table v8 · @dnd-kit · ExcelJS · localStorage persistence
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {dtFeatures.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-foreground/70" />
                  <span className="leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RBAC 4 layers ── */}
        <section className="mb-20">
          <div className="mb-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Bezpieczeństwo
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              RBAC w{" "}
              <span className="text-muted-foreground">4 warstwach.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Każdy element - od server action po przycisk w UI - jest chroniony.
              Role i uprawnienia są izomorficzne: ten sam typ <code className="rounded bg-muted px-1 py-0.5 text-xs">Principal</code> i
              ta sama logika <code className="rounded bg-muted px-1 py-0.5 text-xs">matchesSet()</code> na serwerze i kliencie.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rbacLayers.map(({ num, name, api, where, desc }) => (
              <div
                key={num}
                className="flex gap-4 rounded-2xl border bg-card p-5 shadow-sm"
              >
                <span className="shrink-0 font-mono text-2xl font-bold text-muted-foreground/40 leading-none">
                  {num}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="text-sm font-semibold">{name}</h3>
                    <span className="text-xs text-muted-foreground">{where}</span>
                  </div>
                  <code className="mt-1 block truncate rounded bg-muted px-2 py-1 text-xs text-foreground/80">
                    {api}
                  </code>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Roles table */}
          <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Role i uprawnienia
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { role: "User",  perms: ["dashboard:read", "applications:read"] },
                { role: "Oper",  perms: ["applications:write", "tasks:read", "tasks:write"] },
                { role: "Admin", perms: ["users:read", "users:write", "admin:access", "...all Oper"] },
              ].map(({ role, perms }) => (
                <div key={role} className="rounded-xl border bg-muted/40 p-3">
                  <p className="mb-1.5 text-xs font-semibold">{role}</p>
                  {perms.map((p) => (
                    <span key={p} className="mr-1 mt-1 inline-block rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border">
                      {p}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Domains & routes ── */}
        <section className="mb-20">
          <div className="mb-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Domeny biznesowe
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              6 domen,{" "}
              <span className="text-muted-foreground">20+ widoków.</span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: BarChart3,
                name: "Dashboard",
                routes: ["/dashboard"],
                items: ["KPI cards", "Recharts AreaChart", "Bulk delete", "App Drawer (view + edit)", "Cell Viewer responsywny"],
              },
              {
                Icon: Database,
                name: "Raporty",
                routes: ["/reports", "/reports/new", "/reports/[id]", "/reports/[id]/view"],
                items: ["Wizard create/edit/view", "Monaco SQL editor", "Async generowanie z polling", "Download XLSX", "Uprawnienia per raport"],
              },
              {
                Icon: Layers,
                name: "Aplikacje",
                routes: ["/applications", "/applications/all", "/applications/[id]"],
                items: ["Lista moich aplikacji", "Widok Admin / Oper / User", "Breadcrumb per rolę"],
              },
              {
                Icon: ListOrdered,
                name: "Zadania",
                routes: ["/zadania", "/zadania/new", "/zadania/[id]"],
                items: ["6-krokowy wizard", "File Uploader w kroku", "DualListTransfer przypisania", "WizardSummary"],
              },
              {
                Icon: Globe,
                name: "Projekty & Konkursy",
                routes: ["/projects/active", "/projects/completed", "/competitions/active", "/competitions/archive"],
                items: ["Tabbed layouts", "Aktywne / zakończone / archiwum"],
              },
              {
                Icon: KeyRound,
                name: "Auth",
                routes: ["/auth/sign-in", "/auth/sign-up", "/auth/verify-email", "/auth/reset-password"],
                items: ["Pełny flow rejestracji", "Social providers", "Weryfikacja e-mail", "Reset hasła"],
              },
            ].map(({ Icon, name, routes, items }) => (
              <article key={name} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted">
                    <Icon className="size-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold">{name}</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {routes.map((r) => (
                    <span key={r} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {r}
                    </span>
                  ))}
                </div>
                <ul className="space-y-1">
                  {items.map((i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                      {i}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ── Component ecosystem ── */}
        <section className="mb-20">
          <div className="mb-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Komponenty
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Gotowy ekosystem{" "}
              <span className="text-muted-foreground">UI.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              shadcn/ui base-nova + komponenty domeny + własne prymitywy - wszystko spójne, dostępne i typowane.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {componentTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── UX highlights ── */}
        <section className="mb-20">
          <div className="mb-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              UX & Dostępność
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Szczegóły,{" "}
              <span className="text-muted-foreground">które robią różnicę.</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Eye,
                title: "Dark / Light mode",
                desc: "next-themes bez flash przy hydratacji. Toggle z aria-label zmieniającym się dynamicznie.",
              },
              {
                Icon: Zap,
                title: "Relative time",
                desc: "<RelativeTime> po polsku: 'minute temu'. Zawsze ISO 8601 w title i dateTime dla screen readerow.",
              },
              {
                Icon: ShieldCheck,
                title: "Destructive pattern",
                desc: "Każda destruktywna akcja: trigger (outline) → dialog confirmation → przycisk destructive z pending state.",
              },
              {
                Icon: Layers,
                title: "Responsywne drawery",
                desc: "Drawer zmienia kierunek: bottom na mobile ↔ right na desktop. Automatycznie.",
              },
              {
                Icon: BadgeCheck,
                title: "CopyButton",
                desc: "Status copied/failed, tooltip, sr-only aria-live dla screen readerów. Z Fallback na błąd clipboardu.",
              },
              {
                Icon: KeyRound,
                title: "Keyboard DnD",
                desc: "@dnd-kit z KeyboardSensor i TouchSensor - reorder tabeli dostępny bez myszy.",
              },
              {
                Icon: Globe,
                title: "Breadcrumbs z rejestru",
                desc: "Deklaratywny rejestr + resolver z menu API. Zero prop-drillingu do breadcrumbów.",
              },
              {
                Icon: Zap,
                title: "Server-first perf",
                desc: "React.cache na sesję, dynamic() na wykresy, server-only na ExcelJS (900 KB). Nic zbędnego w bundlu.",
              },
            ].map(({ Icon, title, desc }) => (
              <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
                <Icon className="mb-3 size-5 text-muted-foreground" />
                <h3 className="mb-1 text-sm font-semibold">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── API features from backend ── */}
        {content.features.length > 0 && (
          <section className="mb-20 border-t pt-10">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Wyróżnienia z API
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {content.features.map((feature) => (
                <article
                  key={feature.id}
                  className="rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <BadgeCheck className="mb-3 size-5 text-muted-foreground" />
                  <h3 className="mb-1 text-sm font-semibold leading-snug">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Tech stack ── */}
        <section className="mb-20 border-t pt-10">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Stack technologiczny
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {stackItems.map(({ label, version, category }) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3 shadow-sm"
              >
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {category}
                </span>
                <span className="text-sm font-semibold leading-tight">{label}</span>
                <span className="text-xs text-muted-foreground">{version}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-12">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Gotowy, żeby zacząć?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-balance text-muted-foreground">
            Zmień <code className="rounded bg-muted px-1.5 py-0.5 text-xs">API_URL</code>, podepnij
            backend Laravel i wdrażaj - bez przebudowy komponentów.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-11 rounded-xl px-8" nativeButton={false} render={<Link href="/dashboard" />}>
              Otwórz aplikację
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="lg" className="h-11 rounded-xl px-8" nativeButton={false} render={<Link href="/auth/sign-in" />}>
              Zaloguj się
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {appConfig.name} Web Platform</p>
          <p>
            Next.js {stackItems[0].version} · React {stackItems[1].version} ·
            Tailwind {stackItems[3].version}
          </p>
        </footer>

      </div>
    </main>
  );
}
