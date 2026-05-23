"use client";

// Widok szczegółu wniosku dla roli User.
// Serwer wybrał ten komponent gdy canWrite=false i isAdmin=false.
// Read-only — brak akcji mutujących.

import { useQuery } from "@tanstack/react-query";
import { applicationDetailOptions } from "@/lib/api/domains/applications/query-options";
import { Badge } from "@/components/ui/badge";

type Props = { id: string };

export function ApplicationDetailUser({ id }: Props) {
  const { data, isLoading } = useQuery(applicationDetailOptions(id));

  if (isLoading) return <div className="h-32 animate-pulse rounded-md bg-muted" />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{data.label}</h2>
          <p className="text-sm text-muted-foreground">
            Mój wniosek — widok tylko do odczytu
          </p>
        </div>
        <Badge variant="secondary">User</Badge>
      </header>

      <dl className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="text-sm capitalize">{data.status}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Data złożenia</dt>
          <dd className="text-sm">
            {data.status === "submitted"
              ? data.updatedAt.toLocaleDateString("pl")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Utworzono</dt>
          <dd className="text-sm">{data.createdAt.toLocaleDateString("pl")}</dd>
        </div>
      </dl>

      {/* User nie ma żadnych przycisków akcji — read-only */}
    </div>
  );
}
