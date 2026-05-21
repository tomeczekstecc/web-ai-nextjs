import { matchPath } from "./match"
import type { BreadcrumbEntry, BreadcrumbMapper } from "./types"

type RegistryEntry = {
  /** Route pattern, e.g. `/wizard-demo/:id/view`. */
  match: string
  /** Maps the request context to the full breadcrumb trail. */
  map: BreadcrumbMapper
}

/**
 * Per-feature breadcrumb mappers. Patterns are tried with `matchPath`; the
 * longest matching pattern wins (so `/wizard-demo/:id/view` overrides
 * `/wizard-demo/:id`). Use this registry for trails that depend on dynamic
 * segments or differ from what the menu config alone would produce.
 *
 * Static labels that already live in `MenuConfig` should NOT be duplicated
 * here — `breadcrumbsFromMenu` handles those automatically.
 */
export const breadcrumbRegistry: RegistryEntry[] = [
  // Dashboard — short, single-crumb trail (overrides menu's "Przegląd → Dashboard").
  {
    match: "/dashboard",
    map: () => [{ label: "Przegląd" }],
  },

  // Applications listing root (the menu only declares deeper paths like
  // `/applications/in-progress`, so the listing root needs an explicit entry).
  {
    match: "/applications",
    map: () => [
      { label: "Start", href: "/dashboard" },
      { label: "Applications", href: "/applications" },
      { label: "All Applications" },
    ],
  },

  // Wizard demo (Polish copy, not present in menu config).
  {
    match: "/wizard-demo",
    map: () => [
      { label: "Start", href: "/dashboard" },
      { label: "Zadania" },
    ],
  },
  {
    match: "/wizard-demo/new",
    map: () => [
      { label: "Start", href: "/dashboard" },
      { label: "Zadania", href: "/wizard-demo" },
      { label: "Nowe zadanie" },
    ],
  },
  {
    match: "/wizard-demo/:id",
    map: ({ params }) => [
      { label: "Start", href: "/dashboard" },
      { label: "Zadania", href: "/wizard-demo" },
      { label: `Edycja zadania #${params.id}` },
    ],
  },
  {
    match: "/wizard-demo/:id/view",
    map: ({ params }) => [
      { label: "Start", href: "/dashboard" },
      { label: "Zadania", href: "/wizard-demo" },
      { label: `Podgląd zadania #${params.id}` },
    ],
  },
]

export function resolveFromRegistry(
  pathname: string,
): BreadcrumbEntry[] | null {
  let best: { trail: BreadcrumbEntry[]; len: number } | null = null
  for (const entry of breadcrumbRegistry) {
    const params = matchPath(entry.match, pathname)
    if (!params) continue
    const trail = entry.map({
      pathname,
      segments: pathname.split("/").filter(Boolean),
      params,
    })
    if (!trail) continue
    const len = entry.match.length
    if (!best || len > best.len) best = { trail, len }
  }
  return best ? best.trail : null
}
