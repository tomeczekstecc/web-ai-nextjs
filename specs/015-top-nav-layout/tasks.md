# Tasks: Top-Nav Layout Mode

**Input**: Design documents from `specs/015-top-nav-layout/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: None — constitution forbids automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Install the one new shadcn/ui primitive required by this feature.

- [x] T001 Install `navigation-menu` via `pnpm dlx shadcn@latest add navigation-menu`, producing `src/components/ui/navigation-menu.tsx`

**Checkpoint**: `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `navigationMenuTriggerStyle` are all importable from `@/components/ui/navigation-menu`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Remove `SidebarProvider` dependency from `NavUser` so it can render inside `AppTopNav` without a provider ancestor.

- [x] T002 Fix `src/components/nav-user.tsx` — replace `const { isMobile } = useSidebar()` (line 56) with `const isMobile = useIsMobile()`, add import `useIsMobile` from `@/hooks/use-mobile`, remove `useSidebar` from the `@/components/ui/sidebar` import

**Checkpoint**: `NavUser` renders correctly inside a `SidebarProvider` (sidebar mode, no regression) and outside one (top-nav mode, no crash)

---

## Phase 3: User Story 1 — Top-Bar Navigation (Priority: P1)

**Goal**: When `NEXT_PUBLIC_NAV_LAYOUT=top-menu`, authenticated pages render a sticky horizontal navigation bar showing all server-driven feature items with flyout sub-menus, active-route highlighting, loading skeletons, and a mobile hamburger + Sheet.

**Independent Validation**: Set `NEXT_PUBLIC_NAV_LAYOUT=top-menu` in `.env.local`, run `pnpm dev`. Open `/dashboard` — a sticky top bar appears with "eNGO" brand link on the left, all feature items from the MSW fixture as text-only nav items on desktop, no sidebar panel. On mobile (< 768 px), a hamburger icon is visible; tapping it opens a Sheet from the left with collapsible nav sections. Items with sub-menus show a flyout on hover/focus. The currently active page item is visually highlighted. While the menu is loading, skeleton items show in place of nav items.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create `src/components/nav-main-top.tsx` — `NavMainTop` client component accepting `items: FeatureItem[]`; uses `usePathname()` for active-state prefix-match; renders a `NavigationMenu > NavigationMenuList`; for items with `submenu`: `NavigationMenuTrigger` (text label only, no icon) + `NavigationMenuContent` containing a `<ul>` of `NavigationMenuLink asChild` wrapping Next.js `<Link>` for each sub-item; for items with `to` and no submenu: `NavigationMenuLink asChild className={navigationMenuTriggerStyle()}` wrapping `<Link href={item.to}>` with `active` prop set when `pathname.startsWith(item.to)`; import types from `@/lib/api/domains/menu/contract`

- [x] T004 [P] [US1] Create `src/components/app-top-nav.tsx` — `AppTopNav` client component accepting `user: AppTopNavUser` (name, email, avatar, organizationName?, roles?, permissions?); calls `useMenuConfig()`, `filterFeatures()`, `filterSettings()`; renders `<header className="sticky top-0 z-50 border-b bg-background">` containing: brand `<Link href="/dashboard">` with text "eNGO" on the left; desktop section (`hidden md:flex items-center gap-1`): `NavMainTop items={visibleFeatures}` when loaded, or `<div>` of 4 `<Skeleton className="h-8 w-20">` when `isLoading`; mobile section (`flex md:hidden`): `Sheet` with `SheetTrigger` rendering a `<Button variant="ghost" size="icon">` with `MenuIcon`, and `SheetContent side="left"` containing `NavMain items={visibleFeatures}` (reused collapsible nav); NavUser slot on the right is left as `{null}` — wired in US2; import `NavMainTop` from `@/components/nav-main-top`, `NavMain` from `@/components/nav-main`, `Sheet`/`SheetContent`/`SheetTrigger` from `@/components/ui/sheet`, `Skeleton` from `@/components/ui/skeleton`

- [x] T005 [US1] Create `src/components/app-shell.tsx` — `AppShell` server component (no `"use client"`) accepting `{ children: React.ReactNode; title: string; returnTo?: string }`; calls `await requireAuthorizedAppSession(returnTo ?? "/")` and maps result to `user` object (name, email, avatar, organizationName, roles, permissions); calls `getNavLayout()`; sidebar branch (`navLayout === "sidebar"`): returns `<SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>` wrapping `<AppSidebar user={user} variant="inset" />` and `<SidebarInset><SiteHeader title={title} /><div className="flex flex-1 flex-col">{children}</div></SidebarInset>`; top-nav branch: returns `<div className="flex min-h-svh flex-col"><AppTopNav user={user} /><div className="border-b px-4 py-3 lg:px-6"><h1 className="text-2xl font-bold tracking-tight">{title}</h1></div><main className="flex flex-1 flex-col">{children}</main></div>`; import from `@/lib/menu/env`, `@/lib/auth/session`, `@/components/app-sidebar`, `@/components/app-top-nav`, `@/components/site-header`, `@/components/ui/sidebar`

- [x] T006 [P] [US1] Refactor `src/app/dashboard/page.tsx` — remove imports of `AppSidebar`, `SiteHeader`, `SidebarInset`, `SidebarProvider`, `requireAuthorizedAppSession`; add import `AppShell` from `@/components/app-shell`; remove `const appSession = await requireAuthorizedAppSession(...)` call; replace the entire `<SidebarProvider>…</SidebarProvider>` JSX with `<AppShell title="Przegląd" returnTo="/dashboard"><div className="@container/main flex flex-1 flex-col gap-2"><div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"><SectionCards /><DashboardDataTable /></div></div></AppShell>`

- [x] T007 [P] [US1] Refactor `src/app/applications/page.tsx` — remove imports of `AppSidebar`, `SiteHeader`, `SidebarInset`, `SidebarProvider`, `requireAuthorizedAppSession`; add import `AppShell` from `@/components/app-shell`; remove `const appSession = await requireAuthorizedAppSession(...)` call and all `appSession.access.appUser.*` references; replace the entire `<SidebarProvider>…</SidebarProvider>` JSX with `<AppShell title="Wnioski" returnTo="/applications"><div className="@container/main flex flex-1 flex-col gap-2"><div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"><HydrationBoundary state={dehydrate(queryClient)}><ApplicationsTable /></HydrationBoundary></div></div></AppShell>`

**Checkpoint**: With `NEXT_PUBLIC_NAV_LAYOUT=top-menu`, both `/dashboard` and `/applications` render the sticky top bar with all MSW fixture nav items. With `NEXT_PUBLIC_NAV_LAYOUT=sidebar` (or unset), both pages render the sidebar unchanged.

---

## Phase 4: User Story 2 — User Settings in Top Bar (Priority: P1)

**Goal**: The authenticated user's avatar and settings dropdown are visible at the right end of the top bar and in the mobile Sheet, with full parity to the sidebar footer: theme toggle, account navigation, and logout all work.

**Independent Validation**: In `top-menu` mode, the avatar appears at the top-right of the bar. Clicking it opens a dropdown with all `settings` items from the MSW fixture. Logout redirects to sign-in. Theme toggle switches light/dark. On mobile, the Sheet also shows `NavUser` below the nav items.

### Implementation for User Story 2

- [x] T008 [US2] Add `NavUser` to the desktop bar in `src/components/app-top-nav.tsx` — in the `hidden md:flex` desktop section, render `<NavUser user={user} settings={visibleSettings} />` after the `NavMainTop` / skeleton block, pushed to the right with `ml-auto`; ensure `user` prop includes all fields `NavUser` expects (name, email, avatar); no new component needed

- [x] T009 [US2] Add `NavUser` to the mobile Sheet in `src/components/app-top-nav.tsx` — inside `SheetContent`, add `<NavUser user={user} settings={visibleSettings} />` below `<NavMain>`, separated by a `<Separator />` from `@/components/ui/separator`

**Checkpoint**: Avatar and settings dropdown functional in both desktop top bar and mobile Sheet; theme toggle persists; logout works; sidebar mode `NavUser` behaviour unchanged.

---

## Phase 5: User Story 3 — Layout Switching / Zero Regression (Priority: P2)

**Goal**: Confirm that `NEXT_PUBLIC_NAV_LAYOUT=sidebar` (or unset) leaves the sidebar layout visually and behaviourally identical to before this feature. Both modes serve the same set of nav items for the same user permissions.

**Independent Validation**: Toggle the env var, restart dev server, compare both modes manually against the MSW fixture.

### Implementation for User Story 3

- [ ] T010 [US3] Smoke-test both layout modes manually — set `NEXT_PUBLIC_NAV_LAYOUT=top-menu` in `.env.local`: verify sticky top bar, all 6 fixture nav items visible, flyouts open, active route highlighted, mobile Sheet works, avatar dropdown works, logout works; then set `NEXT_PUBLIC_NAV_LAYOUT=sidebar` (or remove): verify sidebar renders, collapse/expand works, `NavUser` footer works, `SiteHeader` title shows — fix any regressions found before marking done

**Checkpoint**: SC-001 through SC-005 from spec verified; no regressions in sidebar mode.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T011 [P] Verify light/dark theme parity for all new components — toggle theme with both `top-menu` and `sidebar` active; confirm `AppTopNav`, `NavMainTop`, title sub-header, mobile Sheet, and flyout panels all render correctly in both themes; fix any missing `bg-background` or foreground token issues

- [ ] T012 Verify responsive breakpoints end-to-end — at 767 px: hamburger visible, NavigationMenu hidden; at 768 px+: NavigationMenu visible, hamburger hidden; Sheet slides in from left on mobile tap; confirm no horizontal scroll or overflow in top bar at any viewport width between 375 px and 1440 px

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs navigation-menu installed first)
- **US1 (Phase 3)**: Depends on Phase 2 (NavUser fix must be in place before AppTopNav uses it)
  - T003 and T004 can start in parallel once Phase 2 is done
  - T005 (AppShell) depends on T003 + T004 being structurally defined (imports must resolve)
  - T006 and T007 depend on T005 (AppShell must exist before pages import it)
- **US2 (Phase 4)**: Depends on Phase 3 completion
- **US3 (Phase 5)**: Depends on Phase 4 completion
- **Polish (Final)**: Depends on Phase 5 completion

### User Story Dependencies

```
Phase 1 (T001)
  └── Phase 2 (T002)
        ├── T003 [P] NavMainTop
        ├── T004 [P] AppTopNav (structure)
        │     └── T005 AppShell
        │           ├── T006 [P] dashboard/page.tsx
        │           └── T007 [P] applications/page.tsx
        │                 └── Phase 4: T008 → T009
        │                       └── Phase 5: T010
        │                             └── T011 [P], T012
```

### Parallel Opportunities

| Parallel Set | Tasks | Condition |
|---|---|---|
| NavMainTop + AppTopNav structure | T003, T004 | After T002 |
| Page refactors | T006, T007 | After T005 |
| Theme + responsive checks | T011 | After T010 |

---

## Implementation Strategy

**MVP scope (US1 only — T001 through T007)**: Delivers the complete top-bar navigation with all items, flyouts, active states, loading skeleton, mobile Sheet, and `AppShell` integrating both layout modes. Both pages fully refactored. This is the independently shippable increment.

**Full scope (all tasks)**: Adds user avatar + settings in top bar (US2), confirms zero regressions (US3), and polishes theme/responsive behaviour.

**Suggested order for a single session**: T001 → T002 → T003 + T004 (parallel) → T005 → T006 + T007 (parallel) → T008 → T009 → T010 → T011 + T012
