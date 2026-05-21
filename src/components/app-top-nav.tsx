"use client"

import Link from "next/link"

import { NavMainTop } from "@/components/nav-main-top"
import type { AppRole } from "@/lib/auth/principal"
import { NavUser } from "@/components/nav-user"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useMenuConfig } from "@/hooks/menu/useMenuConfig"
import { filterFeatures, filterSettings } from "@/lib/menu/filter"
import { appConfig } from "@/lib/config/app"

export type AppTopNavUser = {
  name: string
  email: string
  avatar?: string
  organizationName?: string
  roles?: readonly AppRole[]
  permissions?: readonly string[]
}

interface AppTopNavProps {
  user: AppTopNavUser
}

export function AppTopNav({ user }: AppTopNavProps) {
  const { data: menuConfig, isLoading, isError } = useMenuConfig()

  if (isError) {
    console.error("[AppTopNav] Failed to load menu config")
  }

  const userPerms = user.permissions ?? []
  const userRoles = user.roles ?? []

  const visibleFeatures = menuConfig
    ? filterFeatures(menuConfig.features, userPerms, userRoles)
    : []
  const visibleSettings = menuConfig
    ? filterSettings(menuConfig.settings, userPerms, userRoles)
    : []

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-[calc(var(--spacing)*12)] items-center gap-4 px-4 md:gap-16 lg:px-6">
        {/* Hamburger triggers the AppSidebar mobile sheet so the same
            nav config powers both layouts on small screens. */}
        <SidebarTrigger className="-ml-1 md:hidden" />

        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          {appConfig.name}
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          {isLoading ? (
            <div className="flex items-center gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <NavMainTop items={visibleFeatures} />
          )}
          <div className="ml-auto">
            <NavUser user={user} settings={visibleSettings} variant="topnav" />
          </div>
        </div>
      </div>
    </header>
  )
}
