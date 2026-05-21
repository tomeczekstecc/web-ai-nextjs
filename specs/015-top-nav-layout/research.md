# Research: Top-Nav Layout Mode (015)

## NavigationMenu Component

**Decision**: Use shadcn/ui `NavigationMenu` installed via CLI.
**Install command**: `pnpm dlx shadcn@latest add navigation-menu`
**Rationale**: Already mandated by spec FR-010. The `base-nova` style variant in this project will style it automatically. Adds `@radix-ui/react-navigation-menu` as the underlying primitive.

### Key API Surface

| Export | Purpose |
|---|---|
| `NavigationMenu` | Root wrapper. Accepts `viewport` prop — pass `false` to suppress the floating viewport (used when positioning manually) |
| `NavigationMenuList` | `<ul>` container for items |
| `NavigationMenuItem` | Individual item wrapper (`<li>`) |
| `NavigationMenuTrigger` | Button that opens a flyout; hover + keyboard activates |
| `NavigationMenuContent` | Flyout panel rendered inside the shared viewport |
| `NavigationMenuLink` | Link element inside content or as a direct nav item; use `asChild` to wrap Next.js `<Link>` |
| `navigationMenuTriggerStyle()` | Utility class fn — applies trigger hover/active styles to a plain link used as a direct nav item (no flyout) |

### Pattern: Item with submenu (flyout)
```tsx
<NavigationMenuItem>
  <NavigationMenuTrigger>Label</NavigationMenuTrigger>
  <NavigationMenuContent>
    <ul>
      <li><NavigationMenuLink asChild><Link href="/path">Sub-item</Link></NavigationMenuLink></li>
    </ul>
  </NavigationMenuContent>
</NavigationMenuItem>
```

### Pattern: Direct link (no flyout)
```tsx
<NavigationMenuItem>
  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
    <Link href="/path">Label</Link>
  </NavigationMenuLink>
</NavigationMenuItem>
```

### Active state
`NavigationMenuLink` accepts a `active` boolean prop that applies the active visual style. Use `pathname.startsWith(item.to)` for prefix-match, consistent with `NavMain`.

---

## AppShell as Server Component

**Decision**: `AppShell` is a React Server Component (no `"use client"` directive).
**Rationale**: 
- `getNavLayout()` reads `process.env.NEXT_PUBLIC_NAV_LAYOUT` — works server-side without hooks
- `requireAuthorizedAppSession()` is already `server-only` and async
- Server Components can render Client Components (`AppSidebar`, `AppTopNav`) as children without issue
- No browser APIs needed in the shell decision logic itself

### Pattern
```tsx
// src/components/app-shell.tsx  — no "use client"
export async function AppShell({ children, title, returnTo = "/" }) {
  const appSession = await requireAuthorizedAppSession(returnTo)
  const navLayout = getNavLayout()
  // ... render sidebar or top-nav branch
}
```

Pages become:
```tsx
export default async function DashboardPage() {
  // domain prefetch stays here
  return (
    <AppShell title="Przegląd" returnTo="/dashboard">
      <SectionCards />
      <DashboardDataTable />
    </AppShell>
  )
}
```

---

## Sticky Top Bar + Flyout Z-Index Stacking

**Decision**: Top bar uses `sticky top-0 z-50`. NavigationMenu viewport (flyout panel) renders at `z-50` via shadcn defaults, which is already above page content.
**Rationale**: Tailwind's `z-50` (z-index: 50) is the standard shadcn layer for floating UI. The flyout content is portalled into the NavigationMenu viewport which is a sibling of the bar in the DOM — it naturally stacks above page content. No custom z-index needed.

---

## NavUser Fix

**Decision**: Replace `const { isMobile } = useSidebar()` with `const isMobile = useIsMobile()` in `nav-user.tsx`.
**Rationale**: `useIsMobile()` at `src/hooks/use-mobile.ts` uses `matchMedia` at the same 768px breakpoint as `useSidebar`. No `SidebarProvider` ancestor required. Zero behaviour change in sidebar mode.

---

## Mobile Sheet Navigation

**Decision**: Reuse `NavMain` component inside the mobile Sheet for the collapsible nav items.
**Rationale**: `NavMain` already handles `Collapsible` + active-child auto-expand + prefix-match active state. Reusing it in the Sheet avoids duplicating the collapsible logic. The Sheet wraps `NavMain` inside a `SidebarMenu`-free context — `NavMain` only needs `FeatureItem[]` props, no sidebar context.

**Note**: `NavMain` uses `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton` etc. — these are styled components but do not require `SidebarProvider`. They will render correctly inside a Sheet without a provider.

---

## Alternatives Considered

| Area | Alternative | Rejected Because |
|---|---|---|
| Layout switching | Route group `(app)/layout.tsx` | Requires moving pages into a new directory; AppShell wrapper achieves the same result without file moves |
| NavUser in top-nav | New `NavUserTop` component | `useIsMobile()` one-line fix makes a new component unnecessary |
| Mobile collapse | Bottom Drawer | Sheet-from-left mirrors sidebar panel pattern; more conventional for nav menus |
| Sub-item flyout | Icons + descriptions | `SubMenuItem.icon` is optional and absent in fixture; `description` field doesn't exist in contract |
