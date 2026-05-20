import { browserFetch } from "@/lib/api/core/browser-http";
import type {
  DashboardChartResponse,
  DashboardQueueResponse,
  DashboardReviewItemsResponse,
} from "@/lib/api/domains/dashboard/contract";

export async function fetchDashboardReviewItems(): Promise<DashboardReviewItemsResponse> {
  const result = await browserFetch<DashboardReviewItemsResponse>("/dashboard/review-items");
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function fetchDashboardChart(): Promise<DashboardChartResponse> {
  const result = await browserFetch<DashboardChartResponse>("/dashboard/chart");
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function fetchDashboardQueue(): Promise<DashboardQueueResponse> {
  const result = await browserFetch<DashboardQueueResponse>("/dashboard/queue");
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
