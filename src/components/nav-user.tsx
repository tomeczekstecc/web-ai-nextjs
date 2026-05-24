"use client"

import * as React from "react"
import { useTransition } from "react"
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
import { resolveIcon } from "@/lib/icons"

const ChevronsUpDownIcon = resolveIcon("ChevronsUpDown");
const MoonIcon = resolveIcon("Moon");
const SunIcon = resolveIcon("Sun");
const PanelLeft = resolveIcon("PanelLeft");
const PanelTop = resolveIcon("PanelTop");
const Loader2 = resolveIcon("Loader2");
import { useTheme } from "next-themes"
import type { SettingsItem } from "@/lib/api/domains/menu/contract"
import { authClient } from "@/lib/auth-client"
import { AUTH_ROUTES } from "@/lib/auth/redirects"
import { setNavLayoutAction } from "@/app/actions/nav-layout"
import { useCurrentNavLayout } from "@/components/nav-layout-provider"

type User = {
  name: string
  email: string
  avatar?: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

function LayoutToggleItem() {
  const currentLayout = useCurrentNavLayout()
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const nextMode = currentLayout === "sidebar" ? "top-menu" : "sidebar"
  const Icon = isPending
    ? Loader2
    : currentLayout === "sidebar"
      ? PanelTop
      : PanelLeft
  const label = currentLayout === "sidebar" ? "Menu górne" : "Panel boczny"

  function handleClick() {
    startTransition(async () => {
      await setNavLayoutAction(nextMode)
      router.refresh()
    })
  }

  return (
    <DropdownMenuItem onClick={handleClick} disabled={isPending}>
      <Icon className={isPending ? "animate-spin" : undefined} />
      {label}
    </DropdownMenuItem>
  )
}

function UserDropdownContent({
  user,
  settings,
  side,
}: {
  user: User
  settings: SettingsItem[]
  side: "bottom" | "right"
}) {
  const initials = getInitials(user.name)
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
    <DropdownMenuContent
      className="min-w-56 rounded-lg"
      side={side}
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
        <LayoutToggleItem />
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
  )
}

export function NavUser({
  user,
  settings,
  variant = "sidebar",
}: {
  user: User
  settings: SettingsItem[]
  variant?: "sidebar" | "topnav"
}) {
  const initials = getInitials(user.name)
  const isMobile = useIsMobile()

  if (variant === "topnav") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 outline-none hover:bg-muted aria-expanded:bg-muted">
          <Avatar className="size-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden grid-flow-row text-left text-sm leading-tight lg:grid">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <ChevronsUpDownIcon className="hidden size-4 text-muted-foreground lg:block" />
        </DropdownMenuTrigger>
        <UserDropdownContent user={user} settings={settings} side="bottom" />
      </DropdownMenu>
    )
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
          <UserDropdownContent
            user={user}
            settings={settings}
            side={isMobile ? "bottom" : "right"}
          />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
