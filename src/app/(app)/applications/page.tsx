import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ApplicationsTable } from "@/components/applications/applications-table";
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options";
import { getQueryClient } from "@/lib/query/client";
// LAYER 1 — server gate: blokuje dostęp bez uprawnienia applications:read
import { requirePermission } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  robots: { index: false },
};

const DEFAULT_LIST_PARAMS = {
  page: 1,
  pageSize: 10,
  search: undefined,
  status: undefined,
  sort: undefined,
} as const;

export default async function ApplicationsPage() {
  // LAYER 1 — server gate.
  // Brak uprawnienia → forbidden() → (app)/forbidden.tsx (HTTP 403).
  // Brak sesji     → unauthorized() → /unauthorized.tsx  (HTTP 401).
  // Zwraca Principal gdy OK — używamy go do przekazania flag do klienta.
  const principal = await requirePermission("applications:read");

  // Flagi capability — decydują co widać w UI (client gates, Layer 4).
  // Sprawdzamy permissions, nie roles — gate jest decoupled od nazw ról.
  const canWrite = principal.permissions.includes("applications:write");
  const isAdmin  = principal.permissions.includes("admin:access");

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(applicationsListOptions(DEFAULT_LIST_PARAMS));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          {/* canWrite i isAdmin przekazane z serwera — bez dodatkowego fetcha po stronie klienta */}
          <ApplicationsTable canWrite={canWrite} isAdmin={isAdmin} />
        </HydrationBoundary>
      </div>
    </div>
  );
}
