import { queryOptions } from "@tanstack/react-query";

import type { ApplicationListParams } from "@/lib/api/domains/applications/contract";
import {
  fetchApplication,
  fetchApplicationList,
} from "@/lib/api/domains/applications/client";
import { applicationsKeys } from "@/lib/api/domains/applications/query-keys";

const ACTIVE_LIST_REFETCH_INTERVAL = 30 * 1000;

export function applicationsListOptions(params: ApplicationListParams) {
  return queryOptions({
    queryKey: applicationsKeys.list(params),
    queryFn: () => fetchApplicationList(params),
    staleTime: 30 * 1000,
    refetchInterval: ACTIVE_LIST_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function applicationDetailOptions(id: string) {
  return queryOptions({
    queryKey: applicationsKeys.detail(id),
    queryFn: () => fetchApplication(id),
    staleTime: 30 * 1000,
  });
}
