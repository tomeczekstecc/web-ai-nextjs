import { NextResponse } from "next/server";
import type { DashboardChartResponse } from "@/lib/api/domains/dashboard/contract";

export async function GET() {
  const response: DashboardChartResponse = {
    points: [
      { date: "2024-01", desktop: 186, mobile: 80 },
      { date: "2024-02", desktop: 305, mobile: 200 },
      { date: "2024-03", desktop: 237, mobile: 120 },
      { date: "2024-04", desktop: 73, mobile: 190 },
      { date: "2024-05", desktop: 209, mobile: 130 },
      { date: "2024-06", desktop: 214, mobile: 140 },
    ],
  };

  return NextResponse.json(response);
}
