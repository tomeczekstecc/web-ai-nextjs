import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleHelp, Component, GitBranch, Globe, ShieldCheck, Zap } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLandingPageContent } from "@/lib/api/domains/landing-page/queries";

export const metadata: Metadata = {
  title: "CI-PRS Web Platform",
  description:
    "Server-first API layer for modern web applications built with Next.js App Router, shadcn/ui, and type-safe data fetching.",
};

export const dynamic = "force-dynamic";

const featureIcons = [BadgeCheck, Zap, CircleHelp, ShieldCheck];

const stackItems = [
  { label: "Next.js",          version: "v16",   category: "Framework" },
  { label: "React",            version: "v19",   category: "UI Runtime" },
  { label: "TypeScript",       version: "v5.8",  category: "Language" },
  { label: "Tailwind CSS",     version: "v4",    category: "Styling" },
  { label: "shadcn/ui",        version: "v4",    category: "Components" },
  { label: "TanStack Query",   version: "v5",    category: "Data Fetching" },
  { label: "TanStack Table",   version: "v8",    category: "Tables" },
  { label: "Zod",              version: "v4",    category: "Validation" },
  { label: "Zustand",          version: "v5",    category: "State" },
  { label: "better-auth",      version: "v1.3",  category: "Auth" },
  { label: "dnd kit",          version: "v6",    category: "Drag & Drop" },
  { label: "MSW",              version: "v2",    category: "Mocking" },
] as const;

export default async function Home() {
  const { content, source } = await getLandingPageContent();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="landing-blob absolute -left-56 -top-56 size-[700px] bg-blue-300/20 dark:bg-blue-800/20"
          style={{ "--blob-duration": "26s" } as React.CSSProperties}
        />
        <div
          className="landing-blob absolute -right-48 -top-20 size-[580px] bg-violet-300/15 dark:bg-violet-800/15"
          style={{ "--blob-duration": "32s", "--blob-delay": "-10s" } as React.CSSProperties}
        />
        <div
          className="landing-blob absolute -bottom-48 left-1/2 size-[540px] -translate-x-1/2 bg-sky-200/20 dark:bg-indigo-900/30"
          style={{ "--blob-duration": "21s", "--blob-delay": "-17s" } as React.CSSProperties}
        />
      </div>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-16 pt-4 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <p className="text-base font-semibold tracking-tight">CI-PRS Web Platform</p>
          <ThemeToggle />
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-start justify-center gap-6 pt-10 pb-10">
          <Badge variant="outline" className="rounded-full px-5 py-2 text-sm">
            {source === "api" ? "Backend online" : "Tryb rezerwowy"} · {content.hero.eyebrow}
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {content.hero.title}{" "}
            <span className="text-muted-foreground">{content.hero.highlight}</span>
          </h1>

          <p className="max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            {content.hero.description}
          </p>

          <Button
            size="lg"
            className="mt-2 h-12 rounded-xl px-6"
            nativeButton={false}
            disabled
            render={<Link href={content.hero.primaryCtaHref} />}
          >
            {content.hero.primaryCtaLabel}
            <ArrowRight data-icon="inline-end" />
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="#" />}
            >
              <GitBranch className="size-4" />
              GitLab
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="#" />}
            >
              <Globe className="size-4" />
              Next.js
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="#" />}
            >
              <Component className="size-4" />
              shadcn/ui
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 border-t pt-12 sm:grid-cols-3">
          {content.features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <article
                key={feature.id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <Icon className="mb-4 size-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold leading-snug tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            );
          })}
        </section>

        {/* Stack */}
        <section className="border-t pt-12">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Stack
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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

        {/* Footer note */}
        <p className="mt-10 text-xs text-muted-foreground">
          Zmień <code className="rounded bg-muted px-1 py-0.5">API_URL</code>, aby podpiąć realny backend — bez zmian w komponencie strony.
        </p>
      </div>
    </main>
  );
}
