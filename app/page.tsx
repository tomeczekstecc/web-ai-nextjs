import Link from "next/link";
import {
  ArrowRight,
  Binary,
  Bot,
  FileCode2,
  GitBranchPlus,
  MoonStar,
  PanelsTopLeft,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const capabilities = [
  {
    title: "Workflow oparty na specyfikacji",
    description:
      "Zamień założenia funkcji w czytelną ścieżkę wdrożenia jeszcze zanim podłączymy endpointy Laravel.",
    icon: FileCode2,
  },
  {
    title: "Frontendowy szkielet aplikacji",
    description:
      "Przemyślana warstwa Next.js App Router przygotowana pod późniejszą integrację z dedykowanym backendem Laravel.",
    icon: PanelsTopLeft,
  },
  {
    title: "Gotowość do pracy z AI",
    description:
      "Projekt wspiera proces CI-PRS, w którym prompty, specyfikacje, review i wykonanie pozostają przejrzyste.",
    icon: Bot,
  },
];

const signals = [
  "Next.js App Router",
  "TypeScript w standardzie",
  "Gotowe pod shadcn/ui",
  "Tryb jasny i ciemny",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top_left,_hsl(var(--brand-glow))_0,_transparent_44%),radial-gradient(circle_at_top_right,_hsl(var(--brand-glow-2))_0,_transparent_38%),linear-gradient(180deg,hsl(var(--background))_0%,transparent_100%)]" />
        <div className="absolute left-1/2 top-32 h-80 w-80 -translate-x-1/2 rounded-full bg-[hsl(var(--brand-orb)/0.28)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(180deg,transparent_0%,hsl(var(--background))_100%)]" />
        <div className="grid-overlay absolute inset-0 opacity-[0.35]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
              CI-PRS
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              AI Spec-Driven-Development for Web
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-border/60 bg-background/70 px-4 py-2 font-mono text-xs text-muted-foreground backdrop-blur md:flex">
              szablon frontendu
            </div>
            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 items-center py-12 lg:py-20">
          <div className="grid w-full gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/65 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur">
                <Binary className="size-3.5" />
                Frontend Next.js dla produktów opartych o Laravel
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-medium tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
                CI-PRS templatka WEB - budujemy kolejne aplikacje z tego forka
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                To mocny punkt startowy dla zespołu, który chce dziś dopracować
                frontend, a jutro bezpiecznie podłączyć Laravel. Szybki do
                rozwijania, elastyczny i gotowy na iteracje wspierane przez AI.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="#capabilities">
                    Zobacz szablon
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#foundation">Poznaj fundament</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {signals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-border/60 bg-background/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_top,_hsl(var(--brand-glow-2)/0.35),transparent_52%)] blur-2xl" />
              <div className="hero-panel relative overflow-hidden rounded-[2rem] border border-border/60 p-6 shadow-[0_30px_100px_-40px_hsl(var(--shadow-color))] backdrop-blur-xl sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Mapa wdrożenia
                    </p>
                    <h2 className="mt-4 text-2xl font-medium tracking-[-0.04em]">
                      Od specyfikacji do dopracowanego UI.
                    </h2>
                  </div>
                  <div className="rounded-full border border-border/60 bg-background/70 p-3">
                    <MoonStar className="size-5 text-[hsl(var(--brand-accent))]" />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {[
                    "Opisz cel i zakres funkcji",
                    "Zaprojektuj kierunek wizualny",
                    "Zaimplementuj warstwę frontendu",
                    "Podłącz dane z Laravel, gdy backend będzie gotowy",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-4 rounded-[1.4rem] border border-border/50 bg-background/60 px-4 py-4"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-foreground text-background font-mono text-xs">
                        0{index + 1}
                      </div>
                      <p className="text-sm text-foreground/88">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-border/50 bg-[hsl(var(--brand-panel))] p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      aktualny tryb
                    </p>
                    <p className="mt-3 text-lg font-medium">Tylko frontend</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Zoptymalizowany pod projektowanie i wdrażanie UI przed spięciem API.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-border/50 bg-background/55 p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      docelowy backend
                    </p>
                    <p className="mt-3 text-lg font-medium">Laravel</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Szkielet pozostaje niezależny i gotowy na bezproblemową integrację.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="grid gap-10 border-t border-border/60 py-16 lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Co daje ten starter
            </p>
            <h2 className="mt-5 max-w-lg text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
              Przemyślana baza pod rozwój produktu, a nie jednorazowe demo.
            </h2>
          </div>

          <div className="space-y-8">
            {capabilities.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="flex gap-5 border-b border-border/50 pb-8 last:border-b-0 last:pb-0"
              >
                <div className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/70">
                  <Icon className="size-5 text-[hsl(var(--brand-accent))]" />
                </div>
                <div>
                  <h3 className="text-xl font-medium tracking-[-0.03em]">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="foundation"
          className="grid gap-8 border-t border-border/60 py-16 lg:grid-cols-[1fr_1fr]"
        >
          <div className="rounded-[2rem] border border-border/60 bg-background/55 p-8 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Fundament
            </p>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em]">
              Czysta struktura dla warstwy webowej.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Szablon jest przygotowany w TypeScript, korzysta z App Routera i
              zachowuje elastyczność frontendu, dzięki czemu kontrakty danych z
              Laravel można dodać bez przebudowy całej warstwy UI.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.7rem] border border-border/60 bg-background/65 p-6">
              <GitBranchPlus className="size-5 text-[hsl(var(--brand-accent))]" />
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                motywy
              </p>
              <p className="mt-3 text-xl font-medium">Tryb jasny i ciemny</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Tokeny motywu i gotowy przełącznik przyspieszają pracę nad interfejsem od pierwszego dnia.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-border/60 bg-[hsl(var(--brand-panel))] p-6">
              <PanelsTopLeft className="size-5 text-[hsl(var(--brand-accent))]" />
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                system UI
              </p>
              <p className="mt-3 text-xl font-medium">Integracja z shadcn/ui</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Konfiguracja, aliasy, helpery i komponenty startowe są już na miejscu.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
