import type { AppTopNavUser } from "@/components/app-top-nav"
import { AppTopNav } from "@/components/app-top-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireAuthorizedAppSession } from "@/lib/auth/session"
import { getNavLayout } from "@/lib/menu/env"

interface AppShellProps {
  children: React.ReactNode
  returnTo?: string
}

export async function AppShell({ children, returnTo = "/" }: AppShellProps) {
  const appSession = await requireAuthorizedAppSession(returnTo)
  const navLayout = getNavLayout()

  const user: AppTopNavUser = {
    name: appSession.access.appUser.displayName,
    email: appSession.access.appUser.email,
    avatar: appSession.access.appUser.avatarUrl || "/avatars/shadcn.svg",
    organizationName: appSession.access.appUser.organizationName ?? undefined,
    roles: appSession.access.appUser.roles,
    permissions: appSession.access.appUser.permissions,
  }

  if (navLayout === "top-menu") {
    return (
      <div className="flex min-h-svh flex-col">
        <AppTopNav user={user} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
