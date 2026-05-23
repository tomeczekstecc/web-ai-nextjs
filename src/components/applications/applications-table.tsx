"use client";

// LAYER 4 — client UI gates.
//
// Trzy narzędzia do różnych przypadków:
//
//  <PermissionGate permissions="...">   — cichy (null), dla przycisków / ikon
//  <RoleGate roles="...">              — cichy (null), gdy koncepcja to rola
//  <AuthorizedView roles/permissions>  — widoczny fallback, dla sekcji strony
//  usePrincipal().hasPermission()      — boolean, dla warunkowych propsów / klas
//
// WAŻNE: to jest UX only. Każda akcja, którą gateuje UI, musi być
// równolegle chroniona przez withPermission / withRole w actions.ts.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGate, RoleGate } from "@/components/auth/role-gate";
import { AuthorizedView } from "@/components/auth/authorized-view";
import { usePrincipal } from "@/hooks/use-principal";
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options";
import type { Application } from "@/lib/api/domains/applications/contract";
// LAYER 2 — server actions z wbudowanym gate-em (withPermission / withRole).
// Importowane do client component — wywoływane przez onClick/useTransition.
import {
  submitApplication,
  archiveApplication,
} from "@/lib/api/domains/applications/actions";

const DEFAULT_PARAMS = {
  page: 1,
  pageSize: 10,
  search: undefined,
  status: undefined,
  sort: undefined,
} as const;

type Props = {
  // Flagi przekazane z serwera (page.tsx) po weryfikacji Principal.
  // Dzięki temu klient nie musi robić osobnego fetcha żeby poznać rolę.
  canWrite: boolean;
  isAdmin: boolean;
};

export function ApplicationsTable({ canWrite, isAdmin }: Props) {
  // Hook do boolean-owych sprawdzeń w JSX (conditional props / className).
  // usePrincipal() rzuca gdy brak PrincipalProvider — łapie błąd "użyłem na publicznej stronie".
  const { hasPermission } = usePrincipal();

  const { data, isLoading, isError } = useQuery(
    applicationsListOptions(DEFAULT_PARAMS),
  );

  if (isLoading) return <TableSkeleton />;
  if (isError || !data)
    return (
      <p className="text-sm text-muted-foreground">Błąd ładowania wniosków.</p>
    );

  return (
    <div className="flex flex-col gap-4">

      {/* ── Nagłówek ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Wnioski</h2>

        {/*
          LAYER 4 — PermissionGate (cichy).
          Przycisk "Nowy wniosek" jest niewidoczny dla User.
          Nawigacja i sam formularz są chronione przez new/layout.tsx → requirePermission.
        */}
        <PermissionGate permissions="applications:write">
          <Button render={<Link href="/applications/new" />} size="sm">
            Nowy wniosek
          </Button>
        </PermissionGate>
      </div>

      {/* ── Panel zarządzania (Oper + Admin) ──────────────────────────── */}
      {/*
        LAYER 4 — AuthorizedView (widoczny fallback dla sekcji strony).
        User widzi uproszczoną informację zamiast panelu.
        Oper i Admin widzą narzędzia zarządzania.
      */}
      <AuthorizedView
        roles={["Oper", "Admin"]}
        fallback={
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Panel zarządzania dostępny dla Operatorów i Administratorów.
          </div>
        }
      >
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-sm font-medium">Panel zarządzania wnioskami</p>
          <p className="text-xs text-muted-foreground">
            Widoczny dla: <code>Oper</code>, <code>Admin</code>
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm">Eksportuj CSV</Button>
            {/*
              LAYER 4 — RoleGate (cichy) wewnątrz AuthorizedView.
              Oper widzi tylko Eksportuj. Admin widzi dodatkowo Konfiguruj.
            */}
            <RoleGate roles="Admin">
              <Button variant="outline" size="sm">Konfiguruj</Button>
            </RoleGate>
          </div>
        </div>
      </AuthorizedView>

      {/* ── Tabela wniosków ───────────────────────────────────────────── */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Wniosek</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                canWrite={canWrite}
                isAdmin={isAdmin}
              />
            ))}
            {data.items.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Brak wniosków.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Informacja diagnostyczna ───────────────────────────────────── */}
      {/*
        LAYER 4 — hasPermission() jako boolean do warunkowego renderowania.
        Używaj gdy potrzebujesz conditional className / disabled prop,
        a nie całego bloku JSX.
      */}
      <p className="text-xs text-muted-foreground">
        Twoje uprawnienia:{" "}
        <code>
          applications:read ✓
          {hasPermission("applications:write") && ", applications:write ✓"}
          {hasPermission("admin:access") && ", admin:access ✓"}
        </code>
      </p>
    </div>
  );
}

// ── Wiersz tabeli ─────────────────────────────────────────────────────────

type RowProps = {
  app: Application;
  canWrite: boolean;
  isAdmin: boolean;
};

function ApplicationRow({ app, canWrite, isAdmin }: RowProps) {
  // useTransition — żeby wywołać server action bez pełnego reload strony.
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      // LAYER 2 — submitApplication jest server action owiniętą przez
      // withPermission("applications:write"). Gate działa po stronie serwera,
      // niezależnie od tego czy UI jest widoczne. Wywołanie przez curl bez sesji
      // i tak dostanie 403 zanim dotrze do ciała akcji.
      await submitApplication(app.id);
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      // LAYER 2 — archiveApplication owinięta przez withRole("Admin").
      // Nawet gdyby ktoś wywołał ten endpoint bezpośrednio — withRole blokuje.
      await archiveApplication(app.id);
    });
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          href={`/applications/${app.id}`}
          className="font-medium hover:underline"
        >
          {app.label}
        </Link>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={app.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">

          {/*
            LAYER 4 — warunek canWrite (flaga z serwera) na przycisku akcji.
            "Złóż" widoczny tylko dla Oper i Admin z applications:write.
            Samo kliknięcie trafia do withPermission w actions.ts.
          */}
          {canWrite && app.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleSubmit}
            >
              Złóż
            </Button>
          )}

          {/*
            LAYER 4 — warunek isAdmin (flaga z serwera) na akcji "Archiwizuj".
            Widoczny wyłącznie dla Admin.
            Wywołanie archiveApplication() chronione przez withRole("Admin") w actions.ts.
          */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleArchive}
              className="text-destructive hover:bg-destructive/10"
            >
              Archiwizuj
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Pomocniki ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Application["status"] }) {
  const map: Record<Application["status"], { label: string; variant: "secondary" | "default" | "outline" }> = {
    draft:     { label: "Szkic",    variant: "secondary" },
    submitted: { label: "Złożony",  variant: "default"   },
    archived:  { label: "Archiwum", variant: "outline"   },
  };

  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
