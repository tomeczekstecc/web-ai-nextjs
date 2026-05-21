"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const diagnostics = [
    error.message && `Komunikat: ${error.message}`,
    error.digest && `Digest: ${error.digest}`,
    error.stack,
  ].filter(Boolean);

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl items-center">
        <section className="grid w-full overflow-hidden rounded-2xl border bg-card shadow-sm md:grid-cols-[0.42fr_0.58fr]">
          <div className="flex min-h-56 flex-col justify-between border-b bg-muted/40 p-6 md:border-b-0 md:border-r lg:p-8">
            <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Status widoku
              </p>
              <p className="text-lg font-semibold">Błąd integracji</p>
            </div>
          </div>

          <div className="flex flex-col gap-7 p-6 sm:p-8 lg:p-10">
            <div className="space-y-4">
              <p className="inline-flex w-fit rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                Błąd strony
              </p>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Nie udało się wyświetlić widoku integracji.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Wystąpił nieoczekiwany problem po stronie aplikacji. Spróbuj
                odświeżyć widok, a jeśli błąd wróci, sprawdź konfigurację
                backendu.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={reset}>
                <RefreshCwIcon className="size-4" aria-hidden="true" />
                Spróbuj ponownie
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                <ArrowLeftIcon className="size-4" aria-hidden="true" />
                Wróć do pulpitu
              </Button>
            </div>

            {diagnostics.length > 0 ? (
              <Collapsible className="group/error-details rounded-xl border bg-muted/30">
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Szczegóły techniczne błędu
                  <ChevronDownIcon
                    className="size-4 shrink-0 transition-transform group-data-open/error-details:rotate-180"
                    aria-hidden="true"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t px-4 py-3">
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-5 text-muted-foreground">
                    {diagnostics.join("\n\n")}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
