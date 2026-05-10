import { http, HttpResponse } from "msw";

import { dashboardChartData } from "@/mocks/data/dashboard-chart";
import { dashboardQueueItems } from "@/mocks/data/dashboard-queue";
import { dashboardReviewItems } from "@/mocks/data/dashboard-review-items";

export const dashboardHandlers = [
  http.get("/api/dashboard/review-items", () =>
    HttpResponse.json({ items: dashboardReviewItems })
  ),
  http.get("/api/dashboard/chart", () =>
    HttpResponse.json({ points: dashboardChartData })
  ),
  http.get("/api/dashboard/queue", () =>
    HttpResponse.json({ items: dashboardQueueItems })
  ),
];
