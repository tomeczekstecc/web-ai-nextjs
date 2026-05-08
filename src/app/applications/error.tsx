"use client";

import { Button } from "@/components/ui/button";

type ApplicationsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ApplicationsError({
  error,
  reset,
}: ApplicationsErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-lg font-semibold">Blad ladowania aplikacji</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Wystapil nieoczekiwany blad. Sprobuj ponownie."}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Sprobuj ponownie
      </Button>
    </div>
  );
}
