# Research: JSON-Driven Navigation Menu Generator

**Feature**: 014-json-menu-gen
**Date**: 2026-05-12
**Status**: Complete

## Research Tasks

All unknowns were resolved during the design interview session with the user. This document consolidates those findings.

---

## 1. Menu API Endpoint Strategy

**Question**: Should the menu endpoint be a Next.js API route that proxies to Laravel, or a direct call to the Laravel backend?

**Decision**: Direct call to `${apiConfig.baseUrl}/api/config/menu`

**Rationale**: This is consistent with how other API domains work in the codebase (e.g., `auth-user`, `applications`). The `apiConfig.baseUrl` pattern is already established. MSW intercepts in development; Laravel serves in production.

**Alternatives Considered**:
- Next.js API route proxy — Rejected: adds unnecessary middleware layer
- Hardcoded URL — Rejected: not configurable per environment

---

## 2. State Management for Menu Data

**Question**: Should menu data be cached in TanStack Query, Zustand, or both?

**Decision**: TanStack Query only. No Zustand slice.

**Rationale**: TanStack Query already provides caching, loading/error states, and cache invalidation. Adding Zustand duplicates state and requires manual sync. The spec's clarification about relying on "TanStack Query cache invalidation" reinforces this choice.

**Alternatives Considered**:
- Both TanStack Query + Zustand — Rejected: duplication, sync complexity
- Zustand only — Rejected: loses TanStack Query's fetch/cache/error handling

---

## 3. Icon Resolution Strategy

**Question**: How should icon name strings from JSON be resolved to Lucide React components?

**Decision**: Static import map with ~15-30 icons. Fallback to `Circle` for unknown names.

**Rationale**: The menu JSON is controlled and predictable. A static map keeps bundle size minimal (~5KB vs ~200KB for all icons). Dynamic imports add latency and complexity for minimal benefit.

**Alternatives Considered**:
- Dynamic imports via `lucide-react/dynamicIconImports` — Rejected: adds latency, complexity
- Import all icons — Rejected: ~200KB bundle impact

---

## 4. Cache Invalidation Strategy

**Question**: When should menu config be refetched?

**Decision**: Rely on page reload. Use `staleTime: Infinity` and `refetchOnWindowFocus: false`.

**Rationale**: Sign-out redirects to `/auth/sign-in` (full page load). Sign-in redirects to `/dashboard` (full page load). The query cache is fresh on each app bootstrap. No explicit invalidation logic needed.

**Alternatives Considered**:
- Explicit invalidation on auth events — Rejected: unnecessary given page reloads
- Background polling — Rejected: spec explicitly excludes this

---

## 5. JSON Structure for Menu Config

**Question**: Should we use the existing nested key-object format or normalize to flat arrays with explicit `key` fields?

**Decision**: Clean format with explicit `key` fields. Rewrite the fixture.

**Rationale**: The original JSON structure (`[{ "playground": { ... } }]`) is awkward to work with and requires extraction logic. A flat structure with `key` as a field (`[{ "key": "playground", ... }]`) is simpler for TypeScript types and filtering.

**Alternatives Considered**:
- Keep nested format, normalize in mapper — Rejected: adds unnecessary transformation layer
- Keep nested format throughout — Rejected: complex types, awkward consumption

---

## 6. Role Filtering Logic

**Question**: User session provides `roles: string[]` (plural). How should `display` filtering work?

**Decision**: ANY match. If any user role is in the item's `display` array, the item is visible.

**Rationale**: Most flexible and intuitive. Mirrors the `perms.mode: "any"` logic. A user with multiple roles sees items allowed for any of their roles.

**Alternatives Considered**:
- ALL match — Rejected: too restrictive, probably not intended
- Use only first role — Rejected: loses multi-role flexibility

---

## 7. Default Behavior for Absent Fields

**Question**: What happens when `display` or `perms` fields are absent from a menu item?

**Decision**: No restriction. Items without these fields are visible to all users.

**Rationale**: Principle of least surprise. If you want to restrict, you add the field. If you want universal visibility, you omit the field.

**Alternatives Considered**:
- Absent means hidden — Rejected: too strict, requires explicit listing for every item

---

## 8. Default Permission Mode

**Question**: When `perms` is present but `mode` is not specified, what is the default?

**Decision**: Default to `"all"` (stricter).

**Rationale**: Safer default. If someone forgets to specify mode, the system enforces stricter access rather than accidentally granting broader access.

**Alternatives Considered**:
- Default to `"any"` — Rejected: could accidentally expose items

---

## 9. User Data Flow

**Question**: Where should `NavUser` get user data (name, email, avatar)?

**Decision**: Props from page → AppSidebar → NavUser.

**Rationale**: User data is already fetched server-side in page components via `requireAuthorizedAppSession()`. Passing via props keeps components presentational and fixes the existing bug where the `user` prop is ignored.

**Alternatives Considered**:
- Client-side `useSession()` hook — Rejected: extra auth call, already have data
- Include in menu API response — Rejected: mixes concerns, user data is session data

---

## 10. Collapsible State Management

**Question**: Should expansion state be controlled or uncontrolled? Should it persist?

**Decision**: Uncontrolled. No persistence. Auto-expand via `defaultOpen` based on active route.

**Rationale**: Matches current behavior. Spec says "open/closed states reset to defaults" when menu changes. Uncontrolled is simpler.

**Alternatives Considered**:
- Controlled state in parent — Rejected: adds complexity without benefit
- Persist to localStorage — Rejected: spec says reset on menu change

---

## 11. Active State on Collapsed Parent

**Question**: When a parent is collapsed but contains the active sub-item, how should it appear?

**Decision**: Same active styling as sub-item.

**Rationale**: When collapsed, the parent effectively represents the active page. Consistent styling keeps it simple and clear.

**Alternatives Considered**:
- Subtle accent (dot, border) — Rejected: adds visual complexity
- No indicator — Rejected: loses orientation cue

---

## 12. Invalid Feature Item Handling

**Question**: What if a feature item has neither `submenu` nor `to`?

**Decision**: Log warning and skip.

**Rationale**: Helps developers catch config errors during development while keeping the UI clean.

**Alternatives Considered**:
- Render as non-interactive — Rejected: clutters UI with unusable items
- Silent skip — Rejected: hides config errors

---

## 13. NavLayout Wrapper Component

**Question**: Should we create a `NavLayout` wrapper component for layout mode switching?

**Decision**: No wrapper. Env check and console warning live in `AppSidebar`.

**Rationale**: Spec says top-menu is "a typed stub." Adding a wrapper now creates abstraction without immediate value. When top-menu is actually built, we refactor.

**Alternatives Considered**:
- Create NavLayout now — Rejected: premature abstraction

---

## Dependencies & Patterns

### Existing Patterns to Follow

| Pattern | Location | Usage in This Feature |
|---------|----------|----------------------|
| API domain structure | `src/lib/api/domains/dashboard/` | Model `menu/` domain identically |
| Query key factory | `src/lib/api/domains/dashboard/query-keys.ts` | Create `menuKeys` with `all`, `config` |
| Query options | `src/lib/api/domains/dashboard/query-options.ts` | Create `menuConfigOptions()` |
| MSW handlers | `src/mocks/handlers/dashboard.ts` | Create `menuHandlers` array |
| Sidebar skeleton | `SidebarMenuSkeleton` in `sidebar.tsx` | Use for loading state |

### New Utilities to Create

| Utility | Location | Purpose |
|---------|----------|---------|
| `resolveIcon()` | `src/lib/menu/icons.ts` | Kebab-case → PascalCase → Lucide component |
| `getNavLayout()` | `src/lib/menu/env.ts` | Read `NEXT_PUBLIC_NAV_LAYOUT`, validate, default to `sidebar` |
| `filterFeatures()` | `src/lib/menu/filter.ts` | Apply display/perms rules to feature items |
| `filterSettings()` | `src/lib/menu/filter.ts` | Apply display/perms rules to settings items |

---

## Resolved: No NEEDS CLARIFICATION Items

All technical decisions were resolved during the design interview. The implementation can proceed without further research.
