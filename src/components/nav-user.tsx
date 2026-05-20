"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChevronsUpDownIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import type { SettingsItem } from "@/lib/api/domains/menu/contract"
import { resolveIcon } from "@/lib/menu/icons"
import { authClient } from "@/lib/auth-client"
import { AUTH_ROUTES } from "@/lib/auth/redirects"

type User = {
  name: string
  email: string
  avatar: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

export function NavUser({
  user,
  settings,
}: {
  user: User
  settings: SettingsItem[]
}) {
  const initials = getInitials(user.name)
  const isMobile = useIsMobile()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  async function handleItemClick(item: SettingsItem) {
    if (item.action === "logout") {
      await authClient.signOut()
      router.push(AUTH_ROUTES.signIn)
      return
    }
    if (item.to) {
      router.push(item.to)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" tooltip={user.name} className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
                {isDark ? <SunIcon /> : <MoonIcon />}
                {isDark ? "Jasny motyw" : "Ciemny motyw"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {settings.map((item) => {
                const Icon = resolveIcon(item.icon)
                const isInteractive = !!(item.to || item.action)
                const isLogout = item.action === "logout"
                return (
                  <React.Fragment key={item.key}>
                    {isLogout && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      disabled={!isInteractive}
                      onClick={isInteractive ? () => handleItemClick(item) : undefined}
                    >
                      <Icon />
                      {item.label}
                    </DropdownMenuItem>
                  </React.Fragment>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
