"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, MenuIcon } from "lucide-react"

import { NavMainTop } from "@/components/nav-main-top"
import { NavUser } from "@/components/nav-user"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useMenuConfig } from "@/hooks/menu/useMenuConfig"
import type { FeatureItem } from "@/lib/api/domains/menu/contract"
import { filterFeatures, filterSettings } from "@/lib/menu/filter"
import { appConfig } from "@/lib/config/app"
import { cn } from "@/lib/utils"

export type AppTopNavUser = {
  name: string
  email: string
  avatar: string
  organizationName?: string
  roles?: string[]
  permissions?: string[]
}

interface AppTopNavProps {
  user: AppTopNavUser
}

function MobileNavItems({ items }: { items: FeatureItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {items.map((item) => {
        const hasSubmenu = item.submenu && item.submenu.length > 0

        if (hasSubmenu) {
          const hasActiveChild =
            item.submenu?.some((sub) => pathname.startsWith(sub.to)) ?? false

          return (
            <Collapsible
              key={item.key}
              defaultOpen={hasActiveChild}
              className="group/collapsible"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                {item.label}
                <ChevronRightIcon className="size-4 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-3 flex flex-col gap-0.5 border-l py-1 pl-3">
                  {item.submenu?.map((sub) => {
                    const isActive = pathname.startsWith(sub.to)
                    return (
                      <Link
                        key={sub.key}
                        href={sub.to}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm hover:bg-muted",
                          isActive && "bg-muted font-medium"
                        )}
                      >
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        }

        if (item.to) {
          const isActive = pathname.startsWith(item.to)
          return (
            <Link
              key={item.key}
              href={item.to}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted",
                isActive && "bg-muted"
              )}
            >
              {item.label}
            </Link>
          )
        }

        return null
      })}
    </nav>
  )
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
      <div className="flex h-[calc(var(--spacing)*12)] items-center gap-16 px-4 lg:px-6">
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

        <div className="ml-auto flex items-center md:hidden">
          <Sheet>
            <SheetTrigger
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <MenuIcon className="size-5" />
              <span className="sr-only">Otwórz menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-full flex-col overflow-y-auto">
                <div className="px-4 py-4">
                  <Link
                    href="/dashboard"
                    className="text-lg font-bold tracking-tight"
                  >
                    {appConfig.name}
                  </Link>
                </div>
                {isLoading ? (
                  <div className="flex flex-col gap-2 px-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <MobileNavItems items={visibleFeatures} />
                )}
                <Separator className="my-2" />
                <div className="px-2 pb-4">
                  <NavUser user={user} settings={visibleSettings} variant="topnav" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
