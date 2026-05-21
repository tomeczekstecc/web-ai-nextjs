# Data Model: Top-Nav Layout Mode (015)

This feature introduces no new domain data models. It reuses the existing `MenuConfig` contract from `src/lib/api/domains/menu/contract.ts` unchanged.

The "models" for this feature are the **component prop interfaces** that form the internal UI contract.

---

## Component Prop Interfaces

### `AppShell` (Server Component)

```ts
interface AppShellProps {
  children: React.ReactNode
  title: string           // Page title — rendered in SiteHeader (sidebar) or sub-header strip (top-nav)
  returnTo?: string       // Auth redirect path, defaults to "/"
}
```

### `AppTopNav` (Client Component)

```ts
type AppTopNavUser = {
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
```

`AppTopNav` owns:
- `useMenuConfig()` — TanStack Query hook for `MenuConfig`
- `filterFeatures()` / `filterSettings()` — permission filter
- `NavMainTop` for desktop NavigationMenu
- `NavUser` for avatar/settings dropdown
- Hamburger + `Sheet` for mobile, containing `NavMain` (reused)

### `NavMainTop` (Client Component)

```ts
interface NavMainTopProps {
  items: FeatureItem[]   // Already permission-filtered by AppTopNav
}
```

Renders:
- `NavigationMenuTrigger` + `NavigationMenuContent` for items with `submenu`
- `NavigationMenuLink` + `navigationMenuTriggerStyle()` for direct-link items
- Active state via `pathname.startsWith(item.to)` prefix-match

---

## Reused Contracts (unchanged)

| Type | Location | Used by |
|---|---|---|
| `MenuConfig` | `src/lib/api/domains/menu/contract.ts` | `AppTopNav` via `useMenuConfig()` |
| `FeatureItem` | same | `NavMainTop`, mobile Sheet |
| `SubMenuItem` | same | `NavMainTop` flyout content |
| `SettingsItem` | same | `NavUser` (unchanged) |
| `NavLayoutMode` | same | `AppShell` via `getNavLayout()` |

---

## State Transitions

| State | Trigger | Result |
|---|---|---|
| `isLoading` (menu) | `useMenuConfig()` pending | `AppTopNav` renders skeleton items in place of `NavMainTop` |
| `isError` (menu) | `useMenuConfig()` error | `AppTopNav` renders brand + user only; error logged |
| Sheet closed → open | Hamburger button click | Mobile sheet slides in from left |
| Sheet open → closed | Close button, overlay click, or nav link click | Sheet closes |
| `top-menu` → `sidebar` | `NEXT_PUBLIC_NAV_LAYOUT` env var change + rebuild | `AppShell` renders sidebar branch; top-nav branch not instantiated |
