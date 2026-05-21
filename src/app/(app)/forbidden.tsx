import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * In-app 403 page. Rendered when any `(app)/*` segment throws `forbidden()`
 * (typically from `requireRole` / `requirePermission`).
 *
 * Next walks up to the nearest `forbidden.tsx`; placing this one inside the
 * `(app)` group keeps the AppShell chrome (sidebar/topnav) visible so the
 * user has somewhere to go next, instead of dumping them on a bare 403.
 *
 * The root-level `src/app/forbidden.tsx` still handles `forbidden()` thrown
 * from outside the app shell (e.g. `/auth/*` or public routes).
 */

export const metadata: Metadata = {
  title: "Brak dostępu",
  robots: { index: false },
};

export default function AppForbidden() {
  const supportLabel = process.env.AUTH_SUPPORT_LABEL?.trim() || null;
  const supportUrl = process.env.AUTH_SUPPORT_URL?.trim() || null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-8xl font-bold text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold">Brak dostępu</h1>
      <p className="max-w-sm text-muted-foreground">
        Nie masz uprawnień do wyświetlenia tego zasobu. Jeśli uważasz, że to
        błąd, skontaktuj się z administratorem.
      </p>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Wróć do panelu
        </Button>
        {supportUrl ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={supportUrl} />}
          >
            {supportLabel ?? "Kontakt"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
