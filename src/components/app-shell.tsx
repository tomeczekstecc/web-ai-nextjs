import { headers } from "next/headers"

import type { AppTopNavUser } from "@/components/app-top-nav"
import { AppTopNav } from "@/components/app-top-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { BreadcrumbBar, PageTitle } from "@/components/breadcrumb-bar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PrincipalProvider } from "@/components/auth/principal-provider"
import { requireAuthorizedAppSession } from "@/lib/auth/session"
import { principalFromAppUser } from "@/lib/auth/principal"
import { sanitizeReturnTo } from "@/lib/auth/redirects"
import { getNavLayout } from "@/lib/menu/env"

interface AppShellProps {
  children: React.ReactNode
  /**
   * Explicit override. When omitted (the common case) AppShell derives
   * `returnTo` from the `x-url` header set by `src/middleware.ts`, so an
   * unauthenticated user landing on `/admin/users/42` is sent back to
   * exactly that URL after sign-in instead of the previous hardcoded `/`.
   */
  returnTo?: string
}

async function resolveReturnTo(explicit: string | undefined) {
  if (explicit) return explicit
  const h = await headers()
  const fromHeader = h.get("x-url") ?? h.get("x-pathname")
  return sanitizeReturnTo(fromHeader, "/")
}

export async function AppShell({ children, returnTo }: AppShellProps) {
  const resolvedReturnTo = await resolveReturnTo(returnTo)
  const appSession = await requireAuthorizedAppSession(resolvedReturnTo)
  const navLayout = getNavLayout()
  const principal = principalFromAppUser(appSession.access.appUser)

  const user: AppTopNavUser = {
    name: appSession.access.appUser.displayName,
    email: appSession.access.appUser.email,
    avatar: appSession.access.appUser.avatarUrl ?? undefined,
    organizationName: appSession.access.appUser.organizationName ?? undefined,
    // Use the normalized principal here — raw `appUser.roles` from the Laravel
    // bridge are untyped `string[]` and may arrive in any casing. The sidebar
    // role filter (`checkDisplay`) does case-sensitive matching against the
    // canonical `AppRole` literals, so feeding it normalized roles is the
    // difference between a populated menu and an empty one.
    roles: principal.roles,
    permissions: principal.permissions,
  }

  if (navLayout === "top-menu") {
    return (
      <PrincipalProvider principal={principal}>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          {/* Mobile-only sidebar: reuses the sidebar nav (and its sheet
              behavior on mobile) so the hamburger in AppTopNav exposes
              the same menu without duplicating navigation code. */}
          <AppSidebar user={user} mobileOnly />
          <div className="flex min-h-svh flex-1 flex-col">
            <AppTopNav user={user} />
            <BreadcrumbBar />
            <PageTitle />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        </SidebarProvider>
      </PrincipalProvider>
    )
  }

  return (
    <PrincipalProvider principal={principal}>
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
          <SiteHeader />
          <PageTitle />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </PrincipalProvider>
  )
}
