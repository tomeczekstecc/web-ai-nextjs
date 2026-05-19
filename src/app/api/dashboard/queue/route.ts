import { NextResponse } from "next/server";
import type { DashboardQueueResponse } from "@/lib/api/domains/dashboard/contract";

export async function GET() {
  const response: DashboardQueueResponse = {
    items: [
      {
        id: "1",
        name: "Review Executive Summary",
        owner: "Eddie Lake",
        priority: "High",
      },
      {
        id: "2",
        name: "Update Technical Approach",
        owner: "Jamik Tashpulatov",
        priority: "Medium",
      },
      {
        id: "3",
        name: "Design Review",
        owner: "Emily Whalen",
        priority: "Low",
      },
    ],
  };

  return NextResponse.json(response);
}
