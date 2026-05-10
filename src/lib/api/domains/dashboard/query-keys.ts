export const dashboardKeys = {
  all: ["dashboard"] as const,
  reviewItems: () => [...dashboardKeys.all, "review-items"] as const,
  chart: () => [...dashboardKeys.all, "chart"] as const,
  queue: () => [...dashboardKeys.all, "queue"] as const,
};
