"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-start justify-center gap-6 rounded-[2rem] border border-destructive/20 bg-card/80 p-8 shadow-[0_28px_80px_-48px_hsl(var(--foreground)/0.32)]">
        <p className="inline-flex rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
          Blad strony
        </p>
        <h1 className="text-4xl font-semibold tracking-tighter text-balance">
          Nie udalo sie wyswietlic widoku integracji.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          Wystapil nieoczekiwany problem po stronie aplikacji. Mozesz sprobowac
          odswiezyc widok albo sprawdzic konfiguracje backendu.
        </p>
        <Button size="lg" onClick={reset}>
          Sprobuj ponownie
        </Button>
      </div>
    </main>
  );
}
