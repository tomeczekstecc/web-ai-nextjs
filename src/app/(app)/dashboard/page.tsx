import type { Metadata } from "next";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import { SectionCards } from "@/components/section-cards";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <DashboardDataTable />
      </div>
    </div>
  );
}
