"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import type { FeatureItem } from "@/lib/api/domains/menu/contract"
import { cn } from "@/lib/utils"

export function NavMainTop({ items }: { items: FeatureItem[] }) {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0

          if (hasSubmenu) {
            const hasActiveChild =
              item.submenu?.some((sub) => pathname.startsWith(sub.to)) ?? false

            return (
              <NavigationMenuItem key={item.key}>
                <NavigationMenuTrigger
                  className={cn(hasActiveChild && "bg-muted/50")}
                >
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex w-48 flex-col gap-0.5 p-1">
                    {item.submenu?.map((sub) => {
                      const isActive = pathname.startsWith(sub.to)
                      return (
                        <li key={sub.key}>
                          <NavigationMenuLink
                            render={<Link href={sub.to} />}
                            active={isActive}
                            closeOnClick
                          >
                            {sub.label}
                          </NavigationMenuLink>
                        </li>
                      )
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          }

          if (item.to) {
            const isActive = pathname.startsWith(item.to)
            return (
              <NavigationMenuItem key={item.key}>
                <NavigationMenuLink
                  render={<Link href={item.to} />}
                  className={navigationMenuTriggerStyle()}
                  active={isActive}
                  closeOnClick
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          }

          return null
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
