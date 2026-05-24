"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { FeatureItem, SubMenuItem } from "@/lib/api/domains/menu/contract"
import { resolveIcon } from "@/lib/icons"

const ChevronRightIcon = resolveIcon("ChevronRight");

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

function isValidFeatureItem(item: FeatureItem): boolean {
  const hasSubmenu = item.submenu && item.submenu.length > 0
  const hasDirectLink = !!item.to
  if (!hasSubmenu && !hasDirectLink) {
    console.warn(`[NavMain] Invalid feature item "${item.key}": missing submenu and to`)
    return false
  }
  return true
}

type SubmenuItemProps = {
  item: FeatureItem
  submenu: SubMenuItem[]
  hasActiveChild: boolean
  pathname: string
  Icon: IconComponent
}

function ExpandedSubmenuItem({
  item,
  submenu,
  hasActiveChild,
  pathname,
  Icon,
}: SubmenuItemProps) {
  // Controlled open state so changing `hasActiveChild` on later renders does
  // not retrigger Base UI's "default open changed" warning. We keep a user
  // override but reset it (during render) when the active-child status flips,
  // so navigating into a section auto-opens it.
  const [override, setOverride] = React.useState<boolean | null>(null)
  const [prevActive, setPrevActive] = React.useState(hasActiveChild)
  if (prevActive !== hasActiveChild) {
    setPrevActive(hasActiveChild)
    setOverride(null)
  }
  const open = override ?? hasActiveChild
  const setOpen = (next: boolean) => setOverride(next)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
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
          {submenu.map((subItem) => {
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
}

function CollapsedSubmenuItem({
  item,
  submenu,
  hasActiveChild,
  pathname,
  Icon,
}: SubmenuItemProps) {
  const router = useRouter()

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip={item.label}
              isActive={hasActiveChild}
              className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
            />
          }
        >
          <Icon />
          <span>{item.label}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={4}
          className="min-w-48 rounded-lg"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {item.label}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {submenu.map((subItem) => {
              const isActive = pathname.startsWith(subItem.to)
              return (
                <DropdownMenuItem
                  key={subItem.key}
                  onClick={() => router.push(subItem.to)}
                  data-active={isActive ? "" : undefined}
                  className="data-[active]:bg-sidebar-accent data-[active]:font-medium data-[active]:text-sidebar-accent-foreground"
                >
                  {subItem.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function NavMain({ items }: { items: FeatureItem[] }) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const validItems = items.filter(isValidFeatureItem)

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-1.5">
        {validItems.map((item) => {
          const Icon = resolveIcon(item.icon) as IconComponent
          const submenu = item.submenu ?? []
          const hasSubmenu = submenu.length > 0

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

          const hasActiveChild = submenu.some((sub) => pathname.startsWith(sub.to))
          const SubmenuComponent = isCollapsed ? CollapsedSubmenuItem : ExpandedSubmenuItem

          return (
            <SubmenuComponent
              key={item.key}
              item={item}
              submenu={submenu}
              hasActiveChild={hasActiveChild}
              pathname={pathname}
              Icon={Icon}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
