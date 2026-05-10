export type DashboardQueueItem = {
  id: string;
  name: string;
  owner: string;
  priority: string;
};

export const dashboardQueueItems: DashboardQueueItem[] = [
  { id: "qa-1", name: "Przegląd narracji", owner: "Eddie Lake", priority: "Wysoki" },
  { id: "qa-2", name: "Materiały techniczne", owner: "Jamik Tashpulatov", priority: "Średni" },
  { id: "qa-3", name: "Dokumenty fokusowe", owner: "Emily Whalen", priority: "Niski" },
];
