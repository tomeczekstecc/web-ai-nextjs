import type { MenuConfig } from "@/lib/api/domains/menu/contract"

import { breadcrumbsFromMenu } from "./from-menu"
import { resolveFromRegistry } from "./registry"
import type { BreadcrumbEntry } from "./types"

/**
 * Resolve breadcrumbs for the given pathname. The per-feature registry takes
 * precedence over the menu-config fallback, so consumers can override or
 * augment menu-derived trails (e.g. add a "Start" root, customize copy for
 * dynamic routes).
 *
 * Returns `null` when no source produces a trail. Callers may treat that as
 * "render no breadcrumb bar".
 */
export function resolveBreadcrumbs(
  pathname: string,
  menu: MenuConfig | undefined,
): BreadcrumbEntry[] | null {
  return resolveFromRegistry(pathname) ?? breadcrumbsFromMenu(pathname, menu)
}
