"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useMenuConfig } from "@/hooks/menu/useMenuConfig"
import { useNavLayout } from "@/hooks/menu/useNavLayout"
import { filterFeatures, filterSettings } from "@/lib/menu/filter"

type User = {
  name: string
  email: string
  avatar: string
  organizationName?: string
  roles?: string[]
  permissions?: string[]
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { data: menuConfig, isLoading, isError, error } = useMenuConfig()
  const navLayout = useNavLayout()

  if (navLayout === "top-menu") {
    console.warn("[AppSidebar] NavLayout 'top-menu' is not yet implemented. Falling back to sidebar.")
  }

  if (isError) {
    console.error("[AppSidebar] Failed to load menu config:", error)
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            eNGO
          </span>
          <span className="hidden text-lg font-bold group-data-[collapsible=icon]:block">
            eN
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <SidebarMenu>
            {Array.from({ length: 5 }).map((_, i) => (
              <SidebarMenuSkeleton key={i} showIcon index={i} />
            ))}
          </SidebarMenu>
        ) : menuConfig ? (
          <NavMain items={visibleFeatures} />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} settings={visibleSettings} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
