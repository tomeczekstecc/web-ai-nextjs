import type { MenuConfig } from "@/lib/api/domains/menu/contract"

import type { BreadcrumbEntry } from "./types"

/**
 * Derive a breadcrumb trail from the menu config by finding the longest
 * matching `to` (feature or submenu item). Returns `null` when no menu entry
 * covers the pathname.
 *
 * Matching rule: a menu entry matches when `pathname === to` or
 * `pathname.startsWith(to + "/")`. The longest match wins, so submenu items
 * (which are usually deeper) take precedence over their parent feature.
 */
export function breadcrumbsFromMenu(
  pathname: string,
  menu: MenuConfig | undefined,
): BreadcrumbEntry[] | null {
  if (!menu) return null

  type Best = { trail: BreadcrumbEntry[]; len: number }
  let best: Best | null = null

  const consider = (trail: BreadcrumbEntry[], to: string) => {
    if (pathname !== to && !pathname.startsWith(to + "/")) return
    if (!best || to.length > best.len) best = { trail, len: to.length }
  }

  for (const feature of menu.features) {
    if (feature.to) {
      consider([{ label: feature.label, href: feature.to }], feature.to)
    }
    for (const sub of feature.submenu ?? []) {
      consider(
        [
          { label: feature.label },
          { label: sub.label, href: sub.to },
        ],
        sub.to,
      )
    }
  }

  return best ? (best as Best).trail : null
}
