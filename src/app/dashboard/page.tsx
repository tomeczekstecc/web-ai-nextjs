import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { dashboardReviewItemsOptions } from "@/lib/api/domains/dashboard/query-options";
import { requireAuthorizedAppSession } from "@/lib/auth/session";
import { getQueryClient } from "@/lib/query/client";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function DashboardPage() {
  const appSession = await requireAuthorizedAppSession("/dashboard");
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(dashboardReviewItemsOptions());

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 76)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{
          name: appSession.access.appUser.displayName,
          email: appSession.access.appUser.email,
          avatar: appSession.access.appUser.avatarUrl || "/avatars/shadcn.svg",
          organizationName: appSession.access.appUser.organizationName ?? undefined,
          roles: appSession.access.appUser.roles,
          permissions: appSession.access.appUser.permissions,
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <HydrationBoundary state={dehydrate(queryClient)}>
                <DashboardDataTable />
              </HydrationBoundary>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
