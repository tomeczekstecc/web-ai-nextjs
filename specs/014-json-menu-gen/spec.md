# Feature Specification: JSON-Driven Navigation Menu Generator

**Feature Branch**: `014-json-menu-gen`
**Created**: 2026-05-12
**Status**: Draft

## What We're Building

Replace the hardcoded navigation data in `app-sidebar.tsx` with a fully server-driven navigation system. Menu items, sections, sub-items, icons, labels, and permission rules all come from a backend API response. A single environment variable controls whether the layout renders as a collapsible sidebar or a top-bar — but for Phase 1–3, only the sidebar layout is implemented. The settings/user section (avatar + user actions) is always pinned to the bottom of the sidebar footer (or the right end of a top-bar when that mode is added).

---

## User Scenarios *(mandatory)*

Każda historia użytkownika musi być niezależnie wartościowa i możliwa do zaprezentowania jako przyrost funkcji.

### User Story 1 - Server-Driven Sidebar Navigation (Priority: P1)

An authenticated user opens the dashboard. Instead of seeing hardcoded menu items baked into the frontend build, the sidebar populates from the menu configuration stored on the server. Changing the menu on the backend (adding a new section, renaming a label, reordering items) is reflected in the UI without a frontend deployment.

**Why this priority**: The core value of this feature — removes the need for frontend changes every time the navigation structure changes. Unblocks all other stories.

**Independent Validation**: With MSW serving the `menu.json` fixture, the sidebar renders exactly the features and labels defined in the fixture. Changing the fixture data and refreshing the page shows the updated navigation.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and the menu API returns a valid JSON config, **When** the dashboard page loads, **Then** the sidebar shows navigation items whose labels, icons, and submenu entries exactly match the API response — not any hardcoded values.
2. **Given** the menu API returns an empty `features` array, **When** the dashboard loads, **Then** the sidebar body is empty (no navigation items shown, no errors thrown).
3. **Given** a menu item has a `submenu` array with three entries, **When** the user expands that item in the sidebar, **Then** all three sub-items appear as clickable links with correct labels and routes.

---

### User Story 2 - Settings Section Always Anchored (Priority: P1)

An authenticated user sees their avatar, name, and email always at the bottom of the sidebar. Clicking the avatar reveals a dropdown whose items (Account, Billing, Notifications, Log out, etc.) come from the `settings` array in the menu JSON — not hardcoded in the component.

**Why this priority**: Directly tied to Story 1 — the settings section is part of the same JSON config and must be consistent with the rest of the server-driven approach.

**Independent Validation**: Change the `settings` array in the MSW fixture (add, remove, or rename an item). Refresh the page. The avatar dropdown reflects the change exactly.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** the sidebar renders, **Then** the avatar, display name, and email from the session appear in the sidebar footer regardless of sidebar collapse state.
2. **Given** the `settings` JSON contains an item with `"action": "logout"`, **When** the user clicks that item in the avatar dropdown, **Then** the user is logged out.
3. **Given** the `settings` JSON contains a navigation item with `"to": "/account"`, **When** the user clicks that item, **Then** the user is navigated to `/account`.
4. **Given** the sidebar is collapsed to icon-only mode, **When** the user hovers over the avatar, **Then** a tooltip with the user's name appears (standard sidebar collapse behavior preserved).

---

### User Story 3 - Active Route Highlighting (Priority: P2)

A user navigating between pages sees the current page's menu item visually highlighted in the sidebar. The highlight updates automatically as the route changes — no full page reload required.

**Why this priority**: Without active-state highlighting the navigation loses its orientation cue. Low implementation effort with high perceived quality impact.

**Independent Validation**: Navigate to `/playground/history`. The "History" sub-item in the sidebar is visually highlighted. Navigate to `/models/genesis`. The "History" highlight disappears and "Genesis" is now highlighted.

**Acceptance Scenarios**:

1. **Given** the user navigates to a route matching a sub-item's `to` value, **When** the sidebar renders, **Then** that sub-item is visually marked as active.
2. **Given** a sub-item is active, **When** its parent feature item is collapsed, **Then** the parent item itself receives an active indicator so the user knows the current page lives under it.
3. **Given** no menu item matches the current route, **When** the sidebar renders, **Then** no item is highlighted (no false positive active states).

---

### User Story 4 - Permission and Role Filtering (Priority: P2)

A user whose session lacks a required permission does not see the corresponding menu items — they are silently omitted. A user with all required permissions sees the full navigation. No error messages or "access denied" placeholders appear for filtered items.

**Why this priority**: Prevents users from seeing navigation options they cannot use. Builds on the data layer from Stories 1–2 and adds the filtering logic.

**Independent Validation**: Simulate a session with a limited permission set (e.g., `["playground_view"]` only). Items requiring `models_view`, `docs_view`, or `projects_view` do not appear in the sidebar. Items requiring only `playground_view` appear normally.

**Acceptance Scenarios**:

1. **Given** a menu item's `perms.list` contains permissions the user does not have and `perms.mode` is `"all"`, **When** the sidebar renders, **Then** that item is not rendered.
2. **Given** a menu item's `perms.mode` is `"any"` and the user has at least one of the listed permissions, **When** the sidebar renders, **Then** that item is rendered.
3. **Given** a feature item's only visible sub-items are all filtered out by permissions, **When** the sidebar renders, **Then** the parent feature item is also hidden.
4. **Given** a menu item's `display` array does not include the user's role, **When** the sidebar renders, **Then** that item is not rendered.

---

### User Story 5 - Env-Controlled Layout Mode (Priority: P3)

A developer or operator can set `NEXT_PUBLIC_NAV_LAYOUT=sidebar` (default) or `top-menu` in the environment and the application will use that layout mode. The same menu JSON drives both layouts. In `sidebar` mode the collapsible sidebar renders exactly as today. The `top-menu` mode is defined structurally (types, env reading) but not rendered in this feature — it is a placeholder for a future phase.

**Why this priority**: Establishes the architectural seam now so the codebase is ready for top-menu without a refactor. The runtime cost in sidebar-only mode is zero.

**Independent Validation**: Set `NEXT_PUBLIC_NAV_LAYOUT=sidebar` and verify the sidebar renders. Set it to an invalid value or omit it — the app falls back to `sidebar` without errors.

**Acceptance Scenarios**:

1. **Given** `NEXT_PUBLIC_NAV_LAYOUT` is set to `sidebar` or is not set, **When** the app renders, **Then** the collapsible sidebar layout is shown.
2. **Given** `NEXT_PUBLIC_NAV_LAYOUT` is set to `top-menu`, **When** the app renders, **Then** a clear "not implemented" fallback is shown (e.g., the sidebar layout with a console warning), not a crash.
3. **Given** an unknown value is set for `NEXT_PUBLIC_NAV_LAYOUT`, **When** the app starts, **Then** the app falls back to `sidebar` and logs a warning.

---

### Edge Cases

- What happens when the menu API is unreachable or returns an error? → The sidebar shows a loading skeleton during fetch; on error it renders an empty nav body with no crash. Toasts or error banners are outside this feature's scope.
- What happens when a top-level feature item has no sub-items? → It renders as a direct link using its `to` field (if present), not as a collapsible group.
- What happens when an icon name from the JSON has no matching lucide icon? → A generic fallback icon (e.g., `Circle`) is rendered. No runtime error.
- What happens when a `settings` item has neither `to` nor `action`? → It renders as a disabled/non-interactive label.
- What happens when the menu JSON changes between navigations (e.g., after a refetch)? → The sidebar re-renders with the new data. Existing open/closed states are reset to defaults.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The navigation structure (feature items, sub-items, labels, icons, routes) MUST be fetched from a server API endpoint at application load, not hardcoded in source files.
- **FR-002**: The menu API response MUST be mocked with MSW during development so the application works without a live backend.
- **FR-003**: Users MUST see the settings section (avatar, display name, email, dropdown actions) pinned to the bottom of the sidebar at all times, populated from the `settings` array in the menu JSON combined with the authenticated user's session data.
- **FR-004**: The sidebar layout and behavior (collapsible, icon-collapse mode, rail, inset variant) MUST be preserved exactly as it operates today.
- **FR-005**: Navigation items MUST reflect the currently active route with a visual highlight, updating on every client-side route change.
- **FR-006**: Menu items MUST be filtered client-side based on the user's session permissions. Items where the user does not satisfy the `perms` check MUST NOT be rendered.
- **FR-007**: Menu items MUST be filtered based on the `display` field matching the user's role. Items where the user's role is not in the `display` array MUST NOT be rendered.
- **FR-008**: The layout mode (sidebar vs. top-menu) MUST be configurable via the `NEXT_PUBLIC_NAV_LAYOUT` environment variable. `sidebar` MUST be the default when the variable is absent or invalid.
- **FR-009**: Icon names in the menu JSON (lucide icon identifier strings) MUST be resolved to rendered icons. When an icon name is unrecognized, a fallback icon MUST be shown without throwing an error.
- **FR-010**: The menu data MUST be available to all components that need it without prop-drilling — via a shared store or query cache.
- **FR-011**: A feature item with no sub-items (empty or absent `submenu`) MUST render as a direct navigation link, not as an expandable group.
- **FR-012**: A feature item whose all sub-items are filtered out by permissions MUST itself be hidden.

### Key Entities

- **MenuConfig**: The root object returned by the API. Has two top-level arrays: `features` (navigation items) and `settings` (user action items).
- **FeatureItem**: A top-level navigation entry. Has a unique key, `label`, `icon`, optional `submenu` array, `display` (role filter), and `perms` (permission filter). May have a `to` field for direct navigation when no submenu exists.
- **SubMenuItem**: A leaf navigation entry nested inside a `FeatureItem.submenu`. Has `label`, `to` (route path), and `perms`. No further nesting.
- **SettingsItem**: A user-action entry in the `settings` array. Has `label`, `icon`, `display`, `perms`, and either a `to` route or an `action` string (e.g., `"logout"`).
- **PermRule**: The `perms` object on any item — `{ list: string[], mode: "all" | "any" }`. Defines which session permissions are required.
- **NavLayoutMode**: An enum-like type: `"sidebar"` | `"top-menu"`. Read from `NEXT_PUBLIC_NAV_LAYOUT` at build/runtime. Controls which layout wrapper renders.

---

## Implementation Phases

### Phase 1 — Types, API Contract, MSW Mock

**Scope**: Define all TypeScript types for the menu JSON shape, establish the API contract, and wire up a fully functional MSW mock that serves the `menu.json` fixture.

**Deliverables**:
- `src/lib/menu/types.ts` — `MenuConfig`, `FeatureItem`, `SubMenuItem`, `SettingsItem`, `PermRule`, `NavLayoutMode`
- `src/lib/menu/env.ts` — reads and validates `NEXT_PUBLIC_NAV_LAYOUT`, exports `getNavLayout(): NavLayoutMode`
- `src/mocks/data/menu.ts` — fixture data matching `docs/menu-gen-specs-files/menu.json` exactly
- `src/mocks/handlers/menu.ts` — MSW handler for `GET /api/config/menu` returning the fixture
- `src/mocks/handlers/index.ts` updated — registers the menu handler

**Exit criteria**: `GET /api/config/menu` via MSW returns the correct JSON. TypeScript compiles without errors on all new types.

---

### Phase 2 — Menu Data Layer (TanStack Query + Zustand)

**Scope**: Fetch the menu config via TanStack Query, cache it, and expose it to the rest of the app via a Zustand store slice.

**Deliverables**:
- `src/hooks/menu/useMenuConfig.ts` — TanStack Query hook that fetches `/api/config/menu`, caches with a stable key, returns `{ data: MenuConfig | undefined, isLoading, isError }`
- `src/lib/store/menu.slice.ts` — Zustand slice: `{ menu: MenuConfig | null, setMenu: (m: MenuConfig) => void }` — written on successful fetch
- `src/lib/store/index.ts` updated — merges menu slice alongside existing wizard slice

**Exit criteria**: `useMenuConfig()` hook returns the MSW-served fixture data. The Zustand store holds the fetched config. Redux DevTools shows `menu/setMenu` action.

---

### Phase 3 — Menu Rendering (Sidebar + Settings)

**Scope**: Refactor `app-sidebar.tsx`, `nav-main.tsx`, and `nav-user.tsx` to be fully driven by the fetched menu data. Active route highlighting via `usePathname()`. Remove all hardcoded menu data.

**Deliverables**:
- `src/hooks/menu/useNavLayout.ts` — reads `getNavLayout()`, exports the active mode
- `src/components/nav-main.tsx` refactored — accepts `FeatureItem[]`, renders collapsible groups (submenu) or direct links (no submenu), highlights active route via `usePathname()`
- `src/components/nav-user.tsx` refactored — accepts `SettingsItem[]` + user session data; dropdown items driven by `settings` array; `action: "logout"` triggers sign-out
- `src/components/app-sidebar.tsx` refactored — calls `useMenuConfig()` (or reads from Zustand); passes `features` to `NavMain` and `settings` + user to `NavUser`; removes all hardcoded `data` object
- `src/lib/menu/icons.ts` — dynamic lucide icon resolver: maps icon name string to component, returns fallback `CircleIcon` for unknown names
- Loading state: sidebar body shows a skeleton group during initial fetch

**Exit criteria**: Sidebar populates from MSW data. Changing the fixture and refreshing reflects the change. Active route is highlighted on the correct item. Avatar dropdown items match the `settings` fixture. Collapsible sidebar behaves identically to today.

---

### Phase 4 — Permission Filtering + Layout Mode Seam

**Scope**: Add client-side permission and role filtering to the rendered navigation. Wire up the env-based layout switch (sidebar renders; top-menu is a typed stub with a fallback).

**Deliverables**:
- `src/lib/menu/filter.ts` — pure functions: `filterFeatures(items: FeatureItem[], perms: string[], role: string): FeatureItem[]` and `filterSettings(items: SettingsItem[], perms: string[], role: string): SettingsItem[]` — apply `display` and `perms` rules, prune parent items whose all children are filtered
- `src/components/app-sidebar.tsx` updated — passes session permissions and role into filter functions before rendering
- `src/components/nav-layout.tsx` — layout switch component: reads `useNavLayout()`, renders `<SidebarLayout>` for `sidebar` mode, renders a `<TopMenuLayout>` stub (returns `<SidebarLayout>` with a `console.warn`) for `top-menu` mode
- `src/app/dashboard/page.tsx` updated — wraps layout in `<NavLayout>` instead of directly using `<SidebarProvider>`

**Exit criteria**: A simulated low-permission session hides the correct items. A full-permission session shows all items. `NEXT_PUBLIC_NAV_LAYOUT=top-menu` renders the sidebar with a console warning (no crash). `filter.ts` has passing unit tests covering `mode: "all"`, `mode: "any"`, `display` filtering, and parent-pruning.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every navigation item visible in the sidebar matches exactly what the `/api/config/menu` endpoint returns — zero hardcoded menu labels, icons, or routes remain in frontend source files.
- **SC-002**: A user with a restricted permission set sees only the menu items their permissions allow — measured by comparing rendered item count against expected filtered count from a known fixture + permission set.
- **SC-003**: Changing the MSW fixture data and reloading the page reflects the change in under 2 seconds with no manual frontend changes — validating the server-driven architecture end-to-end.
- **SC-004**: Active route highlighting is accurate on first render and after every client-side navigation — zero false positives (wrong item highlighted) and zero false negatives (correct item not highlighted) across all routes covered in the fixture.
- **SC-005**: Setting `NEXT_PUBLIC_NAV_LAYOUT` to an invalid value does not crash the application — the sidebar renders and a warning is logged.
- **SC-006**: The sidebar's existing collapse, icon-mode, rail, and inset behaviors work identically after the refactor — verified by manual walkthrough covering every existing interaction.

---

## Assumptions

- The authenticated session already exposes the user's permissions as a string array and their role as a string — no new auth work is required.
- Lucide React is already installed and available as the icon library for this project.
- TanStack Query and Zustand are already configured in the app (wizard feature established this).
- MSW is already running in development mode (established in earlier features).
- `TeamSwitcher` and `NavProjects` are out of scope — they may be removed or left as-is without being driven by the menu JSON.
- The `settings` section does not include a team/organization switcher in this feature; that remains its own concern.
- Sub-items have a maximum nesting depth of 1 (no sub-sub-menus) based on the current JSON shape.
- The `top-menu` layout is not rendered in this feature — only its type definitions and the layout-switch seam are established.
- The menu config is fetched once per session load and cached; no real-time polling or WebSocket updates are in scope.
- Permission data available on the client is trusted (already validated server-side at session creation) — no additional server roundtrip for permission checks during rendering.
