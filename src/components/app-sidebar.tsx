"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { AppRole } from "@/lib/auth/principal"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useMenuConfig } from "@/hooks/menu/useMenuConfig"
import { useNavLayout } from "@/hooks/menu/useNavLayout"
import { useIsMobile } from "@/hooks/use-mobile"
import { filterFeatures, filterSettings } from "@/lib/menu/filter"
import { appConfig } from "@/lib/config/app"

type User = {
  name: string
  email: string
  avatar?: string
  organizationName?: string
  roles?: readonly AppRole[]
  permissions?: readonly string[]
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User
  /**
   * When true the sidebar renders only on mobile viewports (as the
   * offcanvas Sheet). Used by the top-menu layout to expose the same
   * sidebar navigation through a hamburger trigger on small screens
   * without occupying desktop layout space.
   */
  mobileOnly?: boolean
}

export function AppSidebar({ user, mobileOnly = false, ...props }: AppSidebarProps) {
  const { data: menuConfig, isLoading, isError, error } = useMenuConfig()
  const navLayout = useNavLayout()
  const isMobile = useIsMobile()

  if (navLayout === "top-menu" && !mobileOnly) {
    console.warn("[AppSidebar] NavLayout 'top-menu' is not yet implemented. Falling back to sidebar.")
  }

  if (mobileOnly && !isMobile) {
    return null
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
        <div className="flex items-center justify-between px-1 py-0.5 group-data-[collapsible=icon]:justify-center">
          {/* Expanded: logo + name */}
          <div className="flex items-center group-data-[collapsible=icon]:hidden">
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/img/app_logo.png"
                alt={appConfig.name}
                width={48}
                height={48}
                className="size-12 object-contain"
                priority
              />
              <span className="text-lg font-bold tracking-tight">{appConfig.name}</span>
            </Link>
          </div>
          <SidebarTrigger />
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
