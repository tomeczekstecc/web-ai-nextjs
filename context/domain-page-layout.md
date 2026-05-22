# Domain-Scoped Page Layout

How breadcrumbs, the page `<h2>`, and the sidebar collapse trigger are wired in this repository. Domain pages under `src/app/(app)/` render **content only** — the app shell handles all chrome from a config-driven mapper.

---

**Rule:** Domain pages under `src/app/(app)/` do **not** render their own breadcrumbs or
`<h2>` heading. The app shell renders both **once**, deriving them from the current pathname
via a config-driven mapper. Pages contain content only.

## Architecture

```
AppShell  (src/components/app-shell.tsx)
  ├── SiteHeader / AppTopNav         ← navigation chrome
  ├── BreadcrumbBar | BreadcrumbTrail ← from src/components/breadcrumb-bar.tsx
  ├── PageTitle                       ← <h2> derived from last crumb
  └── {children}                      ← page content (no chrome here)
```

Breadcrumbs are resolved by `resolveBreadcrumbs(pathname, menu)` from
`src/lib/breadcrumbs/resolve.ts`, which combines two sources in order:

1. **`breadcrumbRegistry`** — `src/lib/breadcrumbs/registry.ts`. An array of
   `{ match, map }` entries. `match` is a route pattern (`:name` for dynamic
   segments, e.g. `/wizard-demo/:id/view`). `map({ pathname, segments, params })`
   returns the full `BreadcrumbEntry[]` trail. Longest matching pattern wins.
2. **`MenuConfig` fallback** — `src/lib/breadcrumbs/from-menu.ts`. Walks the
   loaded menu config and picks the longest `to` that prefixes the pathname.
   Anything already present in `MenuConfig` (mock or API) becomes breadcrumbs
   automatically — no per-route code.

Nav-mode switching, `<h2>` rendering, and breadcrumb markup are handled by
`AppShell` + `BreadcrumbTrail` / `BreadcrumbBar` / `PageTitle`. Consumers never
import `SiteHeader`, `getNavLayout`, or breadcrumb primitives directly.

## `BreadcrumbEntry` shape

```ts
// src/lib/breadcrumbs/types.ts
export type BreadcrumbEntry = { label: string; href?: string }
```

The **last** entry has no `href` → rendered as `<BreadcrumbPage>` (sets
`aria-current="page"`) and reused as the `<h2>` text by `PageTitle`.

## Standard case — route covered by `MenuConfig`

Nothing to write. Add the route to the menu (or rely on the existing menu
entry) and the breadcrumb appears automatically.

```
src/app/(app)/
  <domain>/
    layout.tsx?   ← optional, only for metadata or shared content padding
    page.tsx      ← content only — no headings, no breadcrumbs
```

## Override / dynamic case — registry entry

Use the registry when:

- the route isn't in `MenuConfig` (e.g. a feature playground like `/wizard-demo`),
- the trail copy must differ from menu labels (e.g. add a `Start` root crumb),
- the trail depends on dynamic segments (e.g. `Edycja zadania #${id}`).

```ts
// src/lib/breadcrumbs/registry.ts
export const breadcrumbRegistry: RegistryEntry[] = [
  {
    match: "/wizard-demo/:id/view",
    map: ({ params }) => [
      { label: "Start",   href: "/dashboard" },
      { label: "Zadania", href: "/wizard-demo" },
      { label: `Podgląd zadania #${params.id}` },
    ],
  },
  // …
]
```

The page itself stays clean:

```tsx
// src/app/(app)/wizard-demo/[id]/view/page.tsx  (server component)
import { TasksWizard } from "@/components/tasks-wizard/TasksWizard"

export default async function ViewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TasksWizard id={Number(id)} mode="view" />
}
```

A route-level `layout.tsx` is only needed for metadata or shared content padding,
not for breadcrumbs:

```tsx
// src/app/(app)/wizard-demo/[id]/layout.tsx — padding only
export default function WizardDemoIdLayout({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-8 lg:px-6">{children}</div>
}
```

## Breadcrumb rules

- Pages **never** call `<DomainLayout>`, `<SiteHeader>`, `<Breadcrumb*>`, or `getNavLayout`.
- The **last item** in a trail has no `href` → becomes `<BreadcrumbPage>` + `<h2>` text.
- Every **preceding item** has an `href` → `<BreadcrumbLink>`.
- Standard depth is 3: `Start → Domain → Current Page`. A 4th level is fine for dynamic
  sub-pages: `Start → Domain → Item → Action`.
- Trails are config: edit `breadcrumbRegistry` (or `MenuConfig`) — never inline in a page.
- When no source matches the pathname, the bar and `<h2>` simply do not render.

## Sidebar collapse trigger placement

`SidebarTrigger` lives in `AppSidebar`'s `SidebarHeader` — always visible, independent of
which domain is active. `AppShell`, `SiteHeader`, and domain files never render it.

## ✅ Correct

```tsx
// page.tsx — content only
export default function RaportyPage() {
  return <RaportyTable />
}
```

```ts
// registry entry for a route not covered by MenuConfig
{
  match: "/raporty/:id",
  map: ({ params }) => [
    { label: "Start",   href: "/dashboard" },
    { label: "Raporty", href: "/raporty" },
    { label: `Raport #${params.id}` },
  ],
}
```

## ❌ Wrong

```tsx
{/* Re-introducing a per-page chrome wrapper */}
import { DomainLayout } from "@/components/domain-layout"   // ← deleted

{/* Calling getNavLayout in a page or layout */}
const navLayout = getNavLayout()

{/* Importing SiteHeader directly */}
import { SiteHeader } from "@/components/site-header"

{/* Writing h2 / h1 manually for the page title */}
<h2 className="text-2xl font-bold tracking-tight">Raporty</h2>
<h1>Raporty</h1>

{/* Inlining breadcrumbs in a page or layout */}
export default function RaportyPage() {
  return <div><Breadcrumb>...</Breadcrumb><RaportyTable /></div>
}
```

## Checklist — before marking a domain complete

- [ ] Page renders content only — no `<DomainLayout>`, `<SiteHeader>`, `<Breadcrumb*>`, or `<h2>`/`<h1>` page title
- [ ] Route is either present in `MenuConfig` or has a `breadcrumbRegistry` entry
- [ ] Last entry of the resolved trail has no `href`
- [ ] Root anchor is `{ label: "Start", href: "/dashboard" }` when an explicit registry trail is needed
- [ ] Dynamic labels use `params` from the registry mapper, not the page
- [ ] No `getNavLayout` or `useNavLayout` reads in domain files
- [ ] Optional `layout.tsx` only carries metadata or shared padding — never chrome

## Related

- `nextjs-patterns.md` — App Router structure
- `ddd-patterns.md` — domain folder layout
- `ui-patterns.md` — visual hierarchy, spacing
