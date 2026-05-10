import type {
  DashboardChartResponse,
  DashboardQueueResponse,
  DashboardReviewItemsResponse,
} from "@/lib/api/domains/dashboard/contract";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function browserFetch<T>(path: string): Promise<FetchResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: (errorData as { message?: string }).message ?? response.statusText,
        },
      };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Błąd sieci",
      },
    };
  }
}

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
