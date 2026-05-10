import { queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardChart,
  fetchDashboardQueue,
  fetchDashboardReviewItems,
} from "@/lib/api/domains/dashboard/client";
import { dashboardKeys } from "@/lib/api/domains/dashboard/query-keys";

export function dashboardReviewItemsOptions() {
  return queryOptions({
    queryKey: dashboardKeys.reviewItems(),
    queryFn: fetchDashboardReviewItems,
    staleTime: 30 * 1000,
  });
}

export function dashboardChartOptions() {
  return queryOptions({
    queryKey: dashboardKeys.chart(),
    queryFn: fetchDashboardChart,
    staleTime: 5 * 60 * 1000,
  });
}

export function dashboardQueueOptions() {
  return queryOptions({
    queryKey: dashboardKeys.queue(),
    queryFn: fetchDashboardQueue,
    staleTime: 30 * 1000,
  });
}
