import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { AppSidebar } from "@/components/app-sidebar";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options";
import { requireAuthorizedAppSession } from "@/lib/auth/session";
import { getQueryClient } from "@/lib/query/client";

const DEFAULT_LIST_PARAMS = {
  page: 1,
  pageSize: 10,
  search: undefined,
  status: undefined,
  sort: undefined,
} as const;

export default async function ApplicationsPage() {
  const appSession = await requireAuthorizedAppSession("/applications");
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(applicationsListOptions(DEFAULT_LIST_PARAMS));

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{
          name: appSession.access.appUser.displayName,
          email: appSession.access.appUser.email,
          avatar: appSession.access.appUser.avatarUrl || "/avatars/shadcn.jpg",
          organizationName: appSession.access.appUser.organizationName,
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <HydrationBoundary state={dehydrate(queryClient)}>
                <ApplicationsTable />
              </HydrationBoundary>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
