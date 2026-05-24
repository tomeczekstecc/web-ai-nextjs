"use client";

// Widok szczegółu wniosku dla roli Oper.
// Serwer wybrał ten komponent gdy canWrite=true i isAdmin=false.

import { useQuery } from "@tanstack/react-query";
import { applicationDetailOptions } from "@/lib/api/domains/applications/query-options";
import { formatDate } from "@/lib/format/date"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = { id: string };

export function ApplicationDetailOper({ id }: Props) {
  const { data, isLoading } = useQuery(applicationDetailOptions(id));

  if (isLoading) return <div className="h-32 animate-pulse rounded-md bg-muted" />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{data.label}</h2>
          <p className="text-sm text-muted-foreground">
            Widok operatora — odczyt i akcje workflow
          </p>
        </div>
        <Badge variant="outline">Operator</Badge>
      </header>

      <dl className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="text-sm">{data.status}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Utworzono</dt>
          <dd className="text-sm">{formatDate(data.createdAt)}</dd>
        </div>
      </dl>

      {/* Oper może zmieniać status, ale nie archiwizować */}
      <div className="flex gap-2">
        {data.status === "draft" && (
          <Button size="sm">Złóż wniosek</Button>
        )}
        <Button variant="outline" size="sm">Przypisz do oceniającego</Button>
      </div>
    </div>
  );
}
