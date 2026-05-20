import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options";
import { getQueryClient } from "@/lib/query/client";

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
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(applicationsListOptions(DEFAULT_LIST_PARAMS));

  return (
    <AppShell title="Wnioski" returnTo="/applications">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ApplicationsTable />
          </HydrationBoundary>
        </div>
      </div>
    </AppShell>
  );
}
