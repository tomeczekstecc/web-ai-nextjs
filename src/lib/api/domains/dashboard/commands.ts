import { browserFetch } from "@/lib/api/core/browser-http";
import type {
  CreateDashboardReviewItemInput,
  DashboardReviewItem,
  UpdateDashboardReviewItemInput,
} from "@/lib/api/domains/dashboard/contract";

export async function createDashboardReviewItem(
  input: CreateDashboardReviewItemInput,
): Promise<DashboardReviewItem> {
  const result = await browserFetch<DashboardReviewItem>("/dashboard/review-items", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function updateDashboardReviewItem(
  id: number,
  input: UpdateDashboardReviewItemInput,
): Promise<DashboardReviewItem> {
  const result = await browserFetch<DashboardReviewItem>(`/dashboard/review-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function deleteDashboardReviewItem(id: number): Promise<void> {
  const result = await browserFetch<void>(`/dashboard/review-items/${id}`, {
    method: "DELETE",
  });
  if (!result.ok) throw new Error(result.error.message);
}

export async function deleteDashboardReviewItems(ids: number[]): Promise<void> {
  const result = await browserFetch<void>("/dashboard/review-items", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
  if (!result.ok) throw new Error(result.error.message);
}
