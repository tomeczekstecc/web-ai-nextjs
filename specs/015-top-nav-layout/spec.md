# Feature Specification: Top-Nav Layout Mode

**Feature Branch**: `015-top-nav-layout`
**Created**: 2026-05-20
**Status**: Draft

## Context

The app already ships a fully functional sidebar layout driven by a server-fetched `MenuConfig` JSON (feature 014). The `NEXT_PUBLIC_NAV_LAYOUT` environment variable can be set to `"top-menu"`, but that mode was explicitly deferred in 014 — today it only logs a warning and falls back to the sidebar. This feature delivers the second, complementary navigation layout: a horizontal top navigation bar that renders the same server-driven `MenuConfig` using shadcn/ui's `NavigationMenu` component. Switching between the two layouts requires only changing the env var — no code change.

---

## Clarifications

### Session 2026-05-20

- Q: Where does the layout switch live — route group layout, AppShell wrapper, or per-page conditional? → A: `AppShell` wrapper component; a single global wrapper used in every authenticated page.
- Q: Should `AppShell` be a Server Component or Client Component? → A: Server Component — it owns both `getNavLayout()` and `requireAuthorizedAppSession()`, removing that boilerplate from every page.
- Q: Where does the page title go in top-nav mode given there's no `SiteHeader`/`SidebarTrigger`? → A: `AppShell` accepts a `title` prop. In sidebar mode it renders `SiteHeader` inside `SidebarInset` (unchanged). In top-nav mode it renders a static slim sub-header strip directly below the nav bar.
- Q: Can `NavUser` be reused in top-nav mode given its `useSidebar()` dependency? → A: Yes — replace `const { isMobile } = useSidebar()` with `const isMobile = useIsMobile()` (already exists at `src/hooks/use-mobile.ts`). One-line fix, no new component.
- Q: What is the mobile collapse pattern for top-nav mode? → A: Hamburger button + `Sheet` sliding in from the left, using the existing `sheet.tsx` component.
- Q: Should top-level feature items in the top bar show icons alongside labels? → A: Text only — no icons. The horizontal bar has limited width; icon + label per item risks overflow with 6+ items.
- Q: What does the flyout show for sub-items? → A: Text only — plain link labels, no icons or descriptions. `SubMenuItem.icon` is optional and absent in the fixture; `SubMenuItem.description` does not exist in the contract.
- Q: What appears at the left end of the top bar? → A: Hardcoded `"eNGO"` text wrapped in `<Link href="/dashboard">` — standard top-nav brand-as-home-link convention.
- Q: How does `AppShell` handle the auth `returnTo` path? → A: Explicit `returnTo?: string` prop, defaults to `"/"` when not provided.
- Q: Where do new components live? → A: Flat in `src/components/` alongside existing shell components — `app-shell.tsx`, `app-top-nav.tsx`, `nav-main-top.tsx`.
- Q: How should `AppShell` handle the per-page `--sidebar-width` inconsistency (`72` vs `76`)? → A: Standardise to `72` spacing units hardcoded inside `AppShell`. The inconsistency is drift, not intentional design.
- Q: How are sub-items presented inside the mobile Sheet? → A: Collapsible sections — reuses the existing `Collapsible` + active-child auto-expand pattern from `NavMain`. Active parent auto-expands on Sheet open.
- Q: Should the top nav bar be sticky as the user scrolls? → A: Yes — `position: sticky; top: 0`. Standard top-nav UX contract; equivalent to the sidebar always being visible in sidebar mode.
- Q: Should the page title sub-header below the top bar also be sticky? → A: No — static, scrolls with page content. Matches current `SiteHeader` scroll behaviour; stacking two sticky strips wastes vertical space.

---

## User Scenarios *(mandatory)*

### User Story 1 - Top-Bar Navigation for Users Who Prefer Horizontal Menus (Priority: P1)

An authenticated user whose organisation has configured `NEXT_PUBLIC_NAV_LAYOUT=top-menu` opens the dashboard. Instead of a collapsible left sidebar, they see a horizontal navigation bar across the top of the screen. All the same sections and links available in the sidebar are accessible from the top bar. The user can navigate the app without ever needing to open a sidebar panel.

**Why this priority**: This is the core deliverable. Without it the feature has no value.

**Independent Validation**: Set `NEXT_PUBLIC_NAV_LAYOUT=top-menu`, reload the app — no sidebar is present, a horizontal nav bar appears at the top and all menu items from the MSW fixture are visible and navigable.

**Acceptance Scenarios**:

1. **Given** `NEXT_PUBLIC_NAV_LAYOUT=top-menu` and a valid `MenuConfig` from the API, **When** an authenticated user loads any app page, **Then** a full-width horizontal navigation bar is visible at the top containing all feature items from the `MenuConfig`; no sidebar panel is rendered.
2. **Given** a feature item has a `submenu` array, **When** the user hovers over or focuses the item in the top nav, **Then** a dropdown/flyout appears listing all sub-items with correct labels and their routes.
3. **Given** a feature item has no `submenu` and has a direct `to` route, **When** the user clicks that item in the top nav, **Then** the browser navigates to the correct route.
4. **Given** the user is on a page whose pathname matches a sub-item's `to` prefix, **When** the top nav renders, **Then** the parent item (and/or the active sub-item) is visually highlighted as the current location.
5. **Given** the `MenuConfig` has not yet loaded, **When** the top nav renders, **Then** placeholder skeleton items are shown in place of the real menu items.

---

### User Story 2 - User Settings Always Accessible in Top Bar (Priority: P1)

An authenticated user sees their avatar and display name on the right end of the top navigation bar. Clicking the avatar reveals the same settings dropdown (account, notifications, logout, theme toggle) that previously lived in the sidebar footer — now surfaced in the top bar.

**Why this priority**: Parity with the sidebar layout — the user identity and quick-action items must be consistently reachable regardless of the active layout mode.

**Independent Validation**: In `top-menu` mode, click the avatar at the right end of the top bar — the dropdown lists all `settings` items from the MSW fixture, theme toggle works, and logout redirects to sign-in.

**Acceptance Scenarios**:

1. **Given** the top-nav layout is active, **When** any authenticated page loads, **Then** the user's avatar, display name, and email are displayed at the right end of the top navigation bar.
2. **Given** the user opens the avatar dropdown in the top bar, **When** they click a `settings` item with a `to` route, **Then** the app navigates to that route.
3. **Given** the user opens the avatar dropdown and clicks the logout item, **When** sign-out completes, **Then** the user is redirected to the sign-in page.
4. **Given** the user toggles the theme via the dropdown in the top bar, **When** the action completes, **Then** the theme switches between light and dark and persists across page reloads.

---

### User Story 3 - Seamless Layout Switching via Environment Variable (Priority: P2)

A developer or operator switches `NEXT_PUBLIC_NAV_LAYOUT` between `"sidebar"` and `"top-menu"` (rebuild/restart required for static env). Both layouts render the same `MenuConfig` data, respect the same permission filter, and show the same set of links. No code change is required — only the env var.

**Why this priority**: Validates the decoupled architecture and protects against regressions in the sidebar layout when the top-nav code is added.

**Independent Validation**: Toggle the env var, rebuild if necessary, confirm each layout mode renders correctly and that the sidebar layout is unaffected by the new top-nav code.

**Acceptance Scenarios**:

1. **Given** `NEXT_PUBLIC_NAV_LAYOUT` is unset or `"sidebar"`, **When** the app loads, **Then** the existing sidebar layout renders exactly as before — no visual regressions.
2. **Given** `NEXT_PUBLIC_NAV_LAYOUT=top-menu`, **When** the app loads, **Then** the top-nav layout renders; the sidebar and its trigger button are absent.
3. **Given** both layouts are tested against the same MSW fixture, **When** navigation items are compared, **Then** each layout renders exactly the same set of visible items for the same user permissions.

---

### Edge Cases

- What happens when the `MenuConfig` API call fails in top-nav mode? The top bar shows a minimal fallback (e.g., only the brand logo and user avatar) without crashing; an error is logged.
- What happens when a feature item's `submenu` is empty or `undefined`? The item renders as a plain link (no dropdown trigger), matching sidebar behaviour.
- What happens when the user has permissions that hide all feature items? The top bar renders with no feature items — only the user avatar/settings section remains.
- What happens on a narrow viewport (mobile) in top-nav mode? The top bar collapses to a hamburger / sheet drawer so the app remains usable on small screens. (Exact responsive behaviour is an implementation decision.)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When `NEXT_PUBLIC_NAV_LAYOUT=top-menu`, the app MUST render a horizontal navigation bar at the top of every authenticated page instead of the collapsible sidebar.
- **FR-002**: The top navigation bar MUST consume the same server-fetched `MenuConfig` (features + settings) as the sidebar — no separate data source or hardcoded items.
- **FR-003**: The top navigation bar MUST apply the same permission/role filter (`filterFeatures`, `filterSettings`) as the sidebar, hiding items the current user is not authorised to see.
- **FR-004**: Feature items with a `submenu` MUST render as interactive triggers that reveal a flyout/dropdown listing all sub-items when activated (hover or keyboard focus).
- **FR-005**: Feature items without a `submenu` (direct `to` route) MUST render as plain navigation links.
- **FR-006**: The currently active route MUST be visually indicated on the relevant top-nav item or sub-item using the same prefix-match logic as the sidebar.
- **FR-007**: The user's avatar and settings dropdown MUST appear at the right end of the top bar and expose the same settings actions (account navigation, theme toggle, logout) as the sidebar footer.
- **FR-008**: The top navigation bar MUST show loading skeleton items while the `MenuConfig` is being fetched.
- **FR-009**: When `NEXT_PUBLIC_NAV_LAYOUT` is absent, invalid, or `"sidebar"`, the existing sidebar layout MUST render unchanged — the top-nav feature MUST NOT introduce regressions.
- **FR-010**: The top-nav component MUST be built using shadcn/ui's `NavigationMenu` primitive for the feature items section.
- **FR-011**: Page content area in top-nav mode MUST be rendered below the top bar with full available viewport height, equivalent to `SidebarInset` behaviour in sidebar mode.

### Key Entities

- **NavLayoutMode**: The two-value discriminant (`"sidebar"` | `"top-menu"`) read from `NEXT_PUBLIC_NAV_LAYOUT` at build/runtime; already defined in the contract.
- **AppTopNav**: New component — the top-bar equivalent of `AppSidebar`; owns the `NavigationMenu`-based feature items and the user avatar/settings section.
- **NavMainTop**: New component — renders `FeatureItem[]` as `NavigationMenu` items with flyout dropdowns for sub-menus.
- **NavUserTop**: New component (or adapted `NavUser`) — renders the user avatar and settings `DropdownMenu` in the top-bar context.
- **AppShell**: Optional wrapper component that conditionally renders `AppSidebar` + `SidebarProvider` or `AppTopNav` based on `NavLayoutMode`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With `NEXT_PUBLIC_NAV_LAYOUT=top-menu`, 100% of the feature items and sub-items present in the MSW fixture are visible and navigable in the top bar for a user with full permissions.
- **SC-002**: With `NEXT_PUBLIC_NAV_LAYOUT=sidebar` (or unset), the sidebar layout renders identically to its state before this feature was added — zero visual or behavioural regressions verified by manual review.
- **SC-003**: Switching between sidebar and top-nav modes requires only an env var change and rebuild — no component source changes required.
- **SC-004**: All interactive top-nav items are keyboard-navigable and meet minimum WCAG 2.1 AA contrast requirements.
- **SC-005**: The active route is correctly highlighted in the top bar within one render cycle of page navigation — no flash of unhighlighted state visible to the user.

---

## Assumptions

- The existing sidebar layout and its supporting components (`AppSidebar`, `NavMain`, `NavUser`, `SidebarProvider`) are left untouched; the top-nav is additive.
- `shadcn/ui` `NavigationMenu` is not yet installed in the project (absent from `src/components/ui/`) and must be added as part of this feature.
- The same `useMenuConfig` TanStack Query hook and `filterFeatures`/`filterSettings` utilities are reused without modification.
- Mobile/responsive behaviour for top-nav mode is in scope and should gracefully collapse on small viewports, but the exact design (hamburger, sheet, etc.) is an implementation decision deferred to planning.
- The `SiteHeader` component (which currently renders the `SidebarTrigger`) is not needed in top-nav mode; top-nav mode provides its own header/title area.
- Pages that do not use the authenticated shell (auth pages, landing page, wizard-demo) are unaffected by this feature.
- The `display` field on `FeatureItem` and `SettingsItem` is handled by the existing filter utilities; no new filtering logic is required.
