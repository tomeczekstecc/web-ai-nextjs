export type DashboardReviewItem = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

export type DashboardChartPoint = {
  date: string;
  desktop: number;
  mobile: number;
};

export type DashboardQueueItem = {
  id: string;
  name: string;
  owner: string;
  priority: string;
};

export type DashboardReviewItemsResponse = {
  items: DashboardReviewItem[];
};

export type DashboardChartResponse = {
  points: DashboardChartPoint[];
};

export type DashboardQueueResponse = {
  items: DashboardQueueItem[];
};
