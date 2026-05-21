import { http, HttpResponse } from "msw";

import { dashboardChartData } from "@/mocks/data/dashboard-chart";
import { dashboardQueueItems } from "@/mocks/data/dashboard-queue";
import { dashboardReviewItems } from "@/mocks/data/dashboard-review-items";
import type { CreateDashboardReviewItemInput, UpdateDashboardReviewItemInput } from "@/lib/api/domains/dashboard/contract";

export const dashboardHandlers = [
  http.get("/api/dashboard/review-items", () =>
    HttpResponse.json({ items: dashboardReviewItems })
  ),

  http.post("/api/dashboard/review-items", async ({ request }) => {
    const body = await request.json() as CreateDashboardReviewItemInput;
    const nextId = dashboardReviewItems.length > 0
      ? Math.max(...dashboardReviewItems.map((i) => i.id)) + 1
      : 1;
    const newItem = { id: nextId, ...body };
    dashboardReviewItems.push(newItem);
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.patch("/api/dashboard/review-items/:id", async ({ request, params }) => {
    const id = Number(params.id);
    const body = await request.json() as UpdateDashboardReviewItemInput;
    const index = dashboardReviewItems.findIndex((i) => i.id === id);
    if (index === -1) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    dashboardReviewItems[index] = { ...dashboardReviewItems[index], ...body };
    return HttpResponse.json(dashboardReviewItems[index]);
  }),

  http.get("/api/dashboard/chart", () =>
    HttpResponse.json({ points: dashboardChartData })
  ),
  http.get("/api/dashboard/queue", () =>
    HttpResponse.json({ items: dashboardQueueItems })
  ),
];
