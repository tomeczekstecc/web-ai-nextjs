# Investigation: App-level Breadcrumbs via path → (label, href) mapper

Status: **investigation only, no code changes yet**
Scope: `src/app/(app)/**` and `src/components/{domain-layout,site-header,app-shell}.tsx`
Goal: Stop having every domain `layout.tsx` / `page.tsx` wrap its tree in
`<DomainLayout breadcrumbs=[…]>` just to render a header + breadcrumb trail.
Instead, render breadcrumbs **once** inside `AppShell` (or a new
`DomainChrome` rendered there), deriving the trail from the current pathname
through a configurable mapper.

---

## 1. Current state

### 1.1 `DomainLayout` is opt-in per route

`src/components/domain-layout.tsx` renders, for every domain page:

- `SiteHeader` (sidebar layout) **or** an inline `<Breadcrumb>` (top-menu layout)
- An `<h2>` page title taken from the **last** breadcrumb entry
- The page `children` inside `px-4 py-4 lg:px-6`

Every domain consumer must hand-author `BreadcrumbEntry[]`:

| File | Breadcrumbs |
|---|---|
| `src/app/(app)/applications/layout.tsx` | `Start → Applications → All Applications` |
| `src/app/(app)/dashboard/layout.tsx` | `Start → Dashboard` (per inspection) |
| `src/app/(app)/wizard-demo/page.tsx` | `Start → Zadania` |
| `src/app/(app)/wizard-demo/new/page.tsx` | `Start → Zadania → Nowe zadanie` |
| `src/app/(app)/wizard-demo/[id]/layout.tsx` | `Start → Zadania → Edycja zadania #${id}` |
| `src/app/(app)/wizard-demo/[id]/view/page.tsx` | `Start → Zadania → Podgląd zadania #${id}` |

Issues:

1. **Boilerplate** — every new route has to import `DomainLayout` and
   re-declare a labels/hrefs array (often duplicating segments already
   declared in the menu config).
2. **Inconsistency risk** — wizard-demo routes mix the breadcrumb wrapper
   between `layout.tsx` and `page.tsx`. `[id]/layout.tsx` already wraps the
   subtree, but `[id]/view/page.tsx` wraps **again**, so children rendered
   under both would double-render the breadcrumb / title. (Worth flagging
   as an existing bug independent of this refactor.)
3. **Two breadcrumb renderers** — `DomainLayout` and `SiteHeader` both
   contain the same `Breadcrumb`/`BreadcrumbList` JSX, just for different
   `navLayout` modes. A unified component should own this once.
4. **Title coupling** — page `<h2>` is implicitly the last breadcrumb. Some
   pages may want a different title than the trail leaf.

### 1.2 What we already know about the URL structure

`src/lib/api/domains/menu/contract.ts` already models navigation entries:

```ts
type FeatureItem  = { key, label, icon, to?, submenu?, … }
type SubMenuItem  = { key, label, to,  icon?, … }
```

`useMenuConfig()` resolves these on the client via the `menu` API domain.
Most static segments in current routes (`/dashboard`, `/applications`,
`/wizard-demo`) correspond to `FeatureItem.to` / `SubMenuItem.to` with a
human label already authored centrally. **We should reuse this as the
primary source of truth before introducing a parallel registry.**

### 1.3 Dynamic segments

Routes like `/wizard-demo/[id]/view` need:

- a label that depends on data the loader has fetched (`Edycja zadania #42`)
- a label whose copy lives near the feature (`Podgląd zadania`, `Nowe zadanie`)

These cannot be derived from menu config alone.

---

## 2. Proposal: lift breadcrumb rendering into `AppShell`

### 2.1 Render once, in the shell

```
AppShell (server)
└── SidebarInset / TopNav main
    └── <DomainChrome>          ← new
        ├── breadcrumb bar      (was SiteHeader / DomainLayout top half)
        ├── page title <h2>     (optional, derived or overridable)
        └── {children}
```

`DomainChrome` reads the current pathname and resolves a
`BreadcrumbEntry[]` via a **mapper**. It replaces both `DomainLayout` and
the breadcrumb portion of `SiteHeader`.

Pathname access:

- Client component → `usePathname()` from `next/navigation`.
- Server component → not directly available; must accept pathname via a
  thin client wrapper or via `headers()` (where `x-invoke-path` /
  middleware-injected header is set). Recommended path: a small `'use
  client'` `BreadcrumbBar` that calls `usePathname()`; everything else
  stays on the server.

### 2.2 The mapper contract

```ts
// src/lib/breadcrumbs/types.ts
export type BreadcrumbEntry = { label: string; href?: string }

export type BreadcrumbContext = {
  pathname: string                  // e.g. /wizard-demo/42/view
  segments: string[]                // ["wizard-demo", "42", "view"]
  params: Record<string, string>    // resolved if known (see §2.4)
}

export type BreadcrumbMapper = (
  ctx: BreadcrumbContext
) => BreadcrumbEntry[] | null  // null → fall through to next mapper
```

A mapper returns the **full trail**, not a single entry. This avoids
brittle “merge per-segment” logic and lets a route emit `Start →
Zadania → Edycja zadania #42` directly.

### 2.3 Mapper composition

Two layers, evaluated in order:

1. **Static mapper from menu config**
   Walks `MenuConfig.features[*].submenu[*]` and matches the longest
   `to` prefix of `pathname`. Yields the chain of labels/hrefs already
   defined for navigation. Always prefixed with the configurable root
   (e.g. `{ label: "Start", href: "/dashboard" }`).

2. **Per-feature mapper registry**
   A map keyed by route pattern → mapper, registered close to the
   feature code:

   ```ts
   // src/lib/breadcrumbs/registry.ts
   export const breadcrumbRegistry: Array<{
     match: string                        // "/wizard-demo/:id/view"
     map: BreadcrumbMapper
   }> = [
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

   First match wins. When no entry matches, fall back to the static
   menu mapper. When that also returns `null`, render no breadcrumb
   bar (or a single `Start` crumb — TBD).

### 2.4 Resolving dynamic params

`usePathname()` gives the literal path. To populate `params`, options:

- **(a) Pattern matching at the mapper layer.** Use a tiny matcher
  (`path-to-regexp` or a 30-line implementation) against each
  registered `match`. Cheap, no Next.js coupling, works in client
  components.
- **(b) `useParams()`.** Works only inside the route subtree; the
  shell sits *above* all routes, so values would be the params of the
  closest segment from the shell's perspective — empty. Reject (a)
  remains preferred.

### 2.5 Data-dependent labels (e.g. `Zadanie: "Wdrożyć X"`)

For labels that need server data (entity title, not just id), there are
three viable patterns. We do **not** need to pick now, but the design
should not block any of them:

- **i. ID-only labels** (current style: `#${id}`). Pure mapper; zero
  data dependency. Recommended default.
- **ii. Context provider per feature.** A page sets
  `<BreadcrumbContext value={{ taskTitle }}>` near its data fetch; the
  shell-level breadcrumb component reads it. Slightly leaks chrome
  responsibility back into pages, but only one value, not a full
  layout wrapper.
- **iii. Server-rendered slot.** A parallel route slot
  (`@breadcrumbs`) in `(app)/layout.tsx` lets feature routes export
  their own breadcrumb segment as a server component. Most powerful,
  highest mechanism cost. Out of scope for the first iteration.

---

## 3. Migration outline (when we decide to act)

1. Introduce `src/lib/breadcrumbs/{types.ts,from-menu.ts,registry.ts,resolve.ts}`.
2. Add a small `BreadcrumbBar` client component that:
   - calls `usePathname()`,
   - calls `resolveBreadcrumbs(pathname, menuConfig)`,
   - renders the existing `Breadcrumb*` primitives.
3. Wire it into `AppShell`:
   - sidebar mode: replace `SiteHeader`'s breadcrumb section with `BreadcrumbBar`.
   - top-menu mode: render the same `BreadcrumbBar` under `AppTopNav`.
4. Add an optional `pageTitle?: string` prop on pages via a tiny
   `<PageTitle>` server component, **or** keep the “last crumb is the
   title” convention and render `<h2>` inside `BreadcrumbBar`.
5. Delete `DomainLayout` usages route-by-route:
   - `applications/layout.tsx`, `dashboard/layout.tsx` →
     remove file or reduce to a no-op (covered fully by menu mapper).
   - `wizard-demo/page.tsx`, `wizard-demo/new/page.tsx`,
     `wizard-demo/[id]/layout.tsx`, `wizard-demo/[id]/view/page.tsx`
     → register entries in the breadcrumb registry, drop the wrapper.
   - Replace the `px-4 py-4 lg:px-6` content padding currently provided
     by `DomainLayout` with either `BreadcrumbBar`’s own spacing or a
     dedicated `<DomainContent>` server component. Important so we
     don’t silently change layout density during the migration.
6. Remove `DomainLayout` once no consumers remain.
7. Fix the existing double-wrap bug in `wizard-demo/[id]/view/page.tsx`
   as part of step 5 (its parent `[id]/layout.tsx` already provides a
   chrome wrapper).

---

## 4. Open questions / decisions needed before implementing

1. **Source of truth for static labels** — reuse `MenuConfig` (preferred)
   or create a separate `routes.ts` registry? Reuse means breadcrumb
   labels stay localized in one place, but couples breadcrumbs to the
   menu API’s availability/loading state in client mode.
2. **Loading state** — `useMenuConfig()` is async. Do we render a
   skeleton crumb, the raw segment, or nothing while it resolves?
3. **Root crumb** — always `Start → /dashboard`, or configurable per
   `(app)`-group? Today it’s hard-coded in every consumer.
4. **Page title coupling** — keep “last crumb = `<h2>`” or split into
   an explicit `pageTitle` prop / `<PageTitle>` component?
5. **Hidden/utility routes** (e.g. `/auth/*`, error pages) — confirm
   `AppShell` is not used there so the new mapper does not need to
   handle them.
6. **i18n** — labels are currently a mix of English (`Applications`,
   `Dashboard`) and Polish (`Zadania`, `Edycja zadania`). The mapper
   layer is a good place to standardize once an i18n strategy lands;
   no new locking-in should happen here.
7. **Server vs client rendering of the breadcrumb bar** — confirmed
   client component is acceptable (it’s tiny, reads `usePathname()`,
   and the rest of the shell already mixes server + client). If we
   want fully server-rendered crumbs, see §2.5.iii (parallel route
   slot).

---

## 5. Recommendation (non-binding)

- Adopt the mapper approach with **menu-config fallback + per-feature
  registry**.
- Render breadcrumbs once inside `AppShell` via a small client
  `BreadcrumbBar`.
- Keep `BreadcrumbEntry` shape (`{ label, href? }`) — it already
  matches `DomainLayout` and `SiteHeader`, so the migration is
  mechanical.
- Treat dynamic-data labels (entity titles) as a **follow-up**; ship
  with id-based labels first to unblock removing `DomainLayout`.
