import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { requirePermission } from "@/lib/auth/rbac";
import { getQueryClient } from "@/lib/query/client";
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options";
import { AllApplicationsTable } from "@/components/applications/all-applications-table";

export const metadata: Metadata = {
  title: "Wszystkie wnioski",
  robots: { index: false },
};

const DEFAULT_LIST_PARAMS = {
  page: 1,
  pageSize: 10,
  search: undefined,
  status: undefined,
  sort: undefined,
} as const;

export default async function AllApplicationsPage() {
  await requirePermission("applications:write");

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(applicationsListOptions(DEFAULT_LIST_PARAMS));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AllApplicationsTable />
    </HydrationBoundary>
  );
}
