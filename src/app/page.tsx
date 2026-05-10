import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  Database,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLandingPageContent } from "@/lib/api/domains/landing-page/queries";

export const metadata: Metadata = {
  title: "CI-PRS Web Platform — Server-First API Layer",
  description:
    "Server-first API layer for modern web applications built with Next.js App Router, shadcn/ui, and type-safe data fetching.",
  openGraph: {
    title: "CI-PRS Web Platform",
    description:
      "Server-first API layer for modern web applications with Next.js App Router, shadcn/ui, and type-safe data fetching.",
    type: "website",
    locale: "pl_PL",
  },
  twitter: {
    card: "summary_large_image",
    title: "CI-PRS Web Platform",
    description:
      "Server-first API layer for modern web applications with Next.js App Router, shadcn/ui, and type-safe data fetching.",
  },
};

export const dynamic = "force-dynamic";

const featureIcons = [BadgeCheck, Zap, CircleHelp, ShieldCheck];

const toneStyles = {
  blue: {
    badge:
      "border-blue-200/70 bg-blue-50/90 text-blue-700 dark:border-white/10 dark:bg-white/4 dark:text-white/78",
    icon: "bg-[#1f6feb] text-white shadow-[0_14px_30px_-18px_rgba(31,111,235,0.7)]",
    stat: "text-sky-600 dark:text-[#7db3ff]",
  },
  violet: {
    badge:
      "border-violet-200/80 bg-violet-50/90 text-violet-700 dark:border-white/10 dark:bg-white/4 dark:text-white/78",
    icon: "bg-[#7c3aed] text-white shadow-[0_14px_30px_-18px_rgba(124,58,237,0.72)]",
    stat: "text-violet-600 dark:text-[#c4b5fd]",
  },
  emerald: {
    badge:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-white/10 dark:bg-white/4 dark:text-white/78",
    icon: "bg-[#059669] text-white shadow-[0_14px_30px_-18px_rgba(5,150,105,0.72)]",
    stat: "text-emerald-600 dark:text-[#6ee7b7]",
  },
} as const;

const getIntegrationCopy = (source: "api" | "fallback", message?: string) => {
  if (source === "api") {
    return {
      label: "Backend online",
      body: "Widok korzysta z danych pobranych po stronie serwera przez typed API helper.",
    };
  }

  return {
    label: "Tryb rezerwowy",
    body:
      message ??
      "Brak odpowiedzi z backendu. Strona korzysta z bezpiecznego fallbacku i pozostaje gotowa do podmiany przez API_URL.",
  };
};

export default async function Home() {
  const { content, source, endpoint, error } = await getLandingPageContent();
  const integrationCopy = getIntegrationCopy(source, error?.message);

  return (
    <main
      id="top"
      className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fcfcfd_0%,#f7f7fb_44%,#eef1f8_100%)] text-slate-950 dark:bg-[#09090b] dark:text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(139,92,246,0.1),transparent_20%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.03),transparent_20%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.36)_0%,rgba(248,250,252,0.15)_45%,rgba(241,245,249,0.08)_100%)] dark:bg-[linear-gradient(180deg,#09090b_0%,#0b0b0f_45%,#111113_100%)]" />
        <div className="absolute inset-x-0 top-[34rem] h-px bg-slate-900/8 dark:bg-white/6" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-20 pt-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            CI-PRS Web Platform
          </p>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 gap-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16 lg:pt-20">
          <div className="pt-2">
            <Badge
              variant="outline"
              className={`rounded-full border px-3 py-1 text-sm ${source === "api" ? toneStyles.blue.badge : toneStyles.violet.badge}`}
            >
              {content.hero.eyebrow}
            </Badge>

            <div className="mt-8 max-w-4xl">
              <h1 className="text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-slate-950 dark:text-white sm:text-6xl lg:text-[5.8rem]">
                {content.hero.title}
                <span className="bg-[linear-gradient(180deg,#0f172a_0%,#4f46e5_52%,#7c3aed_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(180deg,#ffffff_10%,#d4d4d8_54%,#c4b5fd_100%)]">
                  {" "}
                  {content.hero.highlight}
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-balance text-lg leading-8 text-slate-700 dark:text-zinc-300 sm:text-xl">
                {content.hero.description}
              </p>
              {content.hero.secondaryNote ? (
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-400">
                  {content.hero.secondaryNote}
                </p>
              ) : null}
            </div>

            <div className="relative mt-12 max-w-2xl">
              <div className="absolute inset-x-6 top-1/2 h-20 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_62%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_62%)]" />
              <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  className="h-14 min-w-72 rounded-2xl border border-slate-300/80 bg-slate-950 text-white hover:bg-slate-800 dark:border-white/12 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  render={<Link href={content.hero.primaryCtaHref} />}
                >
                  {content.hero.primaryCtaLabel}
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <p className="max-w-xs text-sm leading-6 text-slate-600 dark:text-zinc-400">
                  Gotowe do podpiecia pod realne endpointy Laravel bez przepisywania strony.
                </p>
              </div>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {content.stats.map((stat) => (
                <article
                  key={stat.id}
                  className="rounded-[1.55rem] border border-slate-200/80 bg-white/70 px-5 py-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]"
                >
                  <p className={`text-3xl font-semibold tracking-[-0.05em] ${toneStyles[stat.tone].stat}`}>
                    {stat.value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                    {stat.label}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white/72 p-6 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.25)] backdrop-blur-sm dark:border-white/12 dark:bg-white/[0.04] dark:shadow-[0_32px_90px_-55px_rgba(0,0,0,0.95)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-400">
                  Integracja backendu
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                  Server-first API layer
                </h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950/[0.03] text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-200">
                <Database className="size-5" />
              </span>
            </div>

            <div className="mt-8 rounded-[1.45rem] border border-slate-200/80 bg-slate-50/90 p-5 dark:border-white/12 dark:bg-[#141417]">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={`rounded-full border px-3 py-1 ${source === "api" ? toneStyles.blue.badge : toneStyles.violet.badge}`}
                >
                  {integrationCopy.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border border-slate-300/80 bg-transparent px-3 py-1 text-slate-700 dark:border-white/14 dark:text-white/92"
                >
                  {endpoint}
                </Badge>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-700 dark:text-zinc-300">
                {integrationCopy.body}
              </p>
              {error?.status ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-zinc-500">
                  Status backendu: {error.status}
                </p>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4">
              {content.features.map((feature, index) => {
                const Icon = featureIcons[index % featureIcons.length];

                return (
                  <article
                    key={feature.id}
                    className="rounded-[1.55rem] border border-slate-200/80 bg-slate-50/90 px-6 py-6 shadow-[0_18px_56px_-42px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-[#141417] dark:shadow-[0_18px_56px_-42px_rgba(0,0,0,0.92)]"
                  >
                    <div className={`flex size-11 items-center justify-center rounded-xl ${toneStyles[feature.tone].icon}`}>
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-slate-600 dark:text-zinc-400">
                      {feature.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="benefits"
          className="grid gap-10 border-t border-slate-900/8 pb-8 pt-14 dark:border-white/6 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-16"
        >
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.06em] text-slate-950 dark:text-white sm:text-5xl">
              Dlaczego warto zbudowac strone wlasnie w tym kierunku?
            </h2>

            <div className="mt-10 flex flex-col gap-5">
              {content.benefits.map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-zinc-100 dark:text-black">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-lg leading-8 text-slate-700 dark:text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.85rem] border border-slate-200/80 bg-white/72 px-8 py-8 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-white/12 dark:bg-white/[0.04] dark:shadow-[0_24px_80px_-44px_rgba(0,0,0,0.95)]">
            <div className="grid gap-4">
              {content.stats.map((stat) => (
                <div
                  key={stat.id}
                  className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 px-6 py-6 dark:border-white/10 dark:bg-[#141417]"
                >
                  <p className={`text-4xl font-semibold tracking-[-0.06em] sm:text-5xl ${toneStyles[stat.tone].stat}`}>
                    {stat.value}
                  </p>
                  <p className="mt-3 text-base text-slate-600 dark:text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
              <ShieldCheck className="size-4 text-[#6ee7b7]" />
              spokojny, czytelny i gotowy do rozwoju stack
            </div>
          </div>
        </section>

        <section className="pb-4 pt-4">
          <div className="rounded-[1.4rem] border border-dashed border-slate-300/80 bg-white/60 px-6 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-500">
            Zmien `API_URL`, aby przepiac warstwe danych z fallbacku na realny backend bez zmian w komponencie strony.
          </div>
        </section>
      </div>
    </main>
  );
}
