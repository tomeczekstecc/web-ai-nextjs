"use client";

// Widok szczegółu wniosku dla roli Admin.
// Serwer (applications/[id]/page.tsx) wybrał ten komponent po sprawdzeniu
// principal.permissions.includes("admin:access") — rozgałęzienie jest server-side.

import { useQuery } from "@tanstack/react-query";
import { applicationDetailOptions } from "@/lib/api/domains/applications/query-options";
import type { Application } from "@/lib/api/domains/applications/contract";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthorizedView } from "@/components/auth/authorized-view";

type Props = { id: string };

export function ApplicationDetailAdmin({ id }: Props) {
  const { data, isLoading } = useQuery(applicationDetailOptions(id));

  if (isLoading) return <div className="h-32 animate-pulse rounded-md bg-muted" />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{data.label}</h2>
          <p className="text-sm text-muted-foreground">
            Widok administratora — pełny dostęp
          </p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </header>

      {/* Sekcja wspólna — widoczna dla każdej roli */}
      <ApplicationBaseDetails data={data} />

      {/* Sekcja Admin-only — panel administracyjny */}
      {/*
        LAYER 4 — AuthorizedView jako dodatkowe zabezpieczenie w UI.
        Komponent jest już renderowany wyłącznie dla Adminów (server-side branching),
        ale AuthorizedView daje dodatkową jawność intencji w kodzie.
      */}
      <AuthorizedView permissions="admin:access">
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium">Panel administracyjny</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Historia zmian</Button>
            <Button variant="outline" size="sm">Przepisz właściciela</Button>
            <Button
              size="sm"
              variant="destructive"
            >
              Archiwizuj
            </Button>
          </div>
        </div>
      </AuthorizedView>
    </div>
  );
}

function ApplicationBaseDetails({ data }: { data: Application }) {
  return (
    <dl className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-muted-foreground">ID</dt>
        <dd className="font-mono text-sm">{data.id}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Status</dt>
        <dd className="text-sm">{data.status}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Utworzono</dt>
        <dd className="text-sm">{data.createdAt.toLocaleDateString("pl")}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Zaktualizowano</dt>
        <dd className="text-sm">{data.updatedAt.toLocaleDateString("pl")}</dd>
      </div>
    </dl>
  );
}
