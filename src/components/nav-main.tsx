"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import type { FeatureItem } from "@/lib/api/domains/menu/contract"
import { resolveIcon } from "@/lib/menu/icons"
import { ChevronRightIcon } from "lucide-react"

function isValidFeatureItem(item: FeatureItem): boolean {
  const hasSubmenu = item.submenu && item.submenu.length > 0
  const hasDirectLink = !!item.to
  if (!hasSubmenu && !hasDirectLink) {
    console.warn(`[NavMain] Invalid feature item "${item.key}": missing submenu and to`)
    return false
  }
  return true
}

export function NavMain({ items }: { items: FeatureItem[] }) {
  const pathname = usePathname()
  const validItems = items.filter(isValidFeatureItem)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {validItems.map((item) => {
          const Icon = resolveIcon(item.icon)
          const hasSubmenu = item.submenu && item.submenu.length > 0

          if (!hasSubmenu && item.to) {
            const isActive = pathname.startsWith(item.to)
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton tooltip={item.label} isActive={isActive} render={<Link href={item.to} />}>
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          const hasActiveChild =
            item.submenu?.some((sub) => pathname.startsWith(sub.to)) ?? false

          return (
            <Collapsible
              key={item.key}
              defaultOpen={hasActiveChild}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.label} isActive={hasActiveChild} />}
              >
                <Icon />
                <span>{item.label}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.submenu?.map((subItem) => {
                    const isActive = pathname.startsWith(subItem.to)
                    return (
                      <SidebarMenuSubItem key={subItem.key}>
                        <SidebarMenuSubButton isActive={isActive} render={<Link href={subItem.to} />}>
                          <span>{subItem.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
