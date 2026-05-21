"use client"

import React from "react"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useMenuConfig } from "@/hooks/menu/useMenuConfig"
import { resolveBreadcrumbs } from "@/lib/breadcrumbs/resolve"
import type { BreadcrumbEntry } from "@/lib/breadcrumbs/types"

/**
 * Resolve the breadcrumb trail for the current pathname. Combines the
 * per-feature registry with the menu-config fallback. Returns an empty array
 * when nothing matches.
 */
export function useResolvedBreadcrumbs(): BreadcrumbEntry[] {
  const pathname = usePathname() ?? ""
  const { data: menu } = useMenuConfig()
  return resolveBreadcrumbs(pathname, menu) ?? []
}

/**
 * Renders just the `<Breadcrumb>` markup for the current pathname. Use this
 * inside an existing header bar (e.g. `SiteHeader`) where the surrounding
 * chrome is already provided.
 */
export function BreadcrumbTrail() {
  const trail = useResolvedBreadcrumbs()
  if (trail.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Standalone breadcrumb bar with its own border + padding. Used in top-menu
 * navigation mode where there is no `SiteHeader` to host the trail. Renders
 * nothing when the current pathname has no resolved breadcrumbs.
 */
export function BreadcrumbBar() {
  const trail = useResolvedBreadcrumbs()
  if (trail.length === 0) return null

  return (
    <div className="border-b px-4 py-3 lg:px-6">
      <BreadcrumbTrail />
    </div>
  )
}

/**
 * Page title derived from the last breadcrumb entry. Rendered once by the
 * app shell so individual pages do not need to repeat the heading.
 */
export function PageTitle() {
  const trail = useResolvedBreadcrumbs()
  const title = trail[trail.length - 1]?.label
  if (!title) return null

  return (
    <div className="px-4 py-4 lg:px-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  )
}
