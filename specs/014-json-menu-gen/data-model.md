# Data Model: JSON-Driven Navigation Menu Generator

**Feature**: 014-json-menu-gen
**Date**: 2026-05-12

## Overview

This document defines the TypeScript types for the menu configuration system. These types represent the API contract and are used throughout the frontend for type-safe menu rendering and filtering.

---

## Core Entities

### MenuConfig

The root object returned by the `/api/config/menu` endpoint.

```typescript
type MenuConfig = {
  features: FeatureItem[]
  settings: SettingsItem[]
}
```

**Description**: Contains two arrays — navigation items for the sidebar body and action items for the user dropdown.

---

### FeatureItem

A top-level navigation entry in the sidebar.

```typescript
type FeatureItem = {
  key: string
  label: string
  icon: string
  to?: string
  submenu?: SubMenuItem[]
  display?: string[]
  perms?: PermRule
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Unique identifier for the item |
| `label` | `string` | Yes | Display text (Polish) |
| `icon` | `string` | Yes | Lucide icon name in kebab-case (e.g., `"terminal"`, `"book"`) |
| `to` | `string` | No | Route path for direct navigation (used when no submenu) |
| `submenu` | `SubMenuItem[]` | No | Nested navigation items (collapsible group) |
| `display` | `string[]` | No | Roles that can see this item. Absent = visible to all. |
| `perms` | `PermRule` | No | Permission requirements. Absent = no restriction. |

**Validation Rules**:
- Must have either `to` OR `submenu` (not both, not neither)
- If both are absent, item is logged as warning and skipped
- `key` must be unique within the `features` array

**State Transitions**: N/A (static config)

---

### SubMenuItem

A leaf navigation entry nested inside a `FeatureItem.submenu`.

```typescript
type SubMenuItem = {
  key: string
  label: string
  to: string
  icon?: string
  perms?: PermRule
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Unique identifier within parent submenu |
| `label` | `string` | Yes | Display text (Polish) |
| `to` | `string` | Yes | Route path for navigation |
| `icon` | `string` | No | Optional icon (some submenus have icons, e.g., Projects) |
| `perms` | `PermRule` | No | Permission requirements. Absent = inherits parent visibility. |

**Validation Rules**:
- `to` is required (sub-items are always navigable)
- No further nesting (max depth = 1)

---

### SettingsItem

A user-action entry in the avatar dropdown.

```typescript
type SettingsItem = {
  key: string
  label: string
  icon: string
  to?: string
  action?: string
  display?: string[]
  perms?: PermRule
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Unique identifier |
| `label` | `string` | Yes | Display text (Polish) |
| `icon` | `string` | Yes | Lucide icon name in kebab-case |
| `to` | `string` | No | Route path for navigation |
| `action` | `string` | No | Action identifier (e.g., `"logout"`) |
| `display` | `string[]` | No | Roles that can see this item |
| `perms` | `PermRule` | No | Permission requirements |

**Validation Rules**:
- Should have either `to` OR `action` (not both)
- If neither, renders as non-interactive label (disabled state)

**Supported Actions**:
- `"logout"` — Signs out the user via `authClient.signOut()`

---

### PermRule

Permission requirement definition.

```typescript
type PermRule = {
  list: string[]
  mode?: 'all' | 'any'
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `list` | `string[]` | Yes | Permission strings to check against user session |
| `mode` | `'all' \| 'any'` | No | Match mode. Default: `'all'` |

**Behavior**:
- `mode: 'all'` — User must have ALL permissions in `list`
- `mode: 'any'` — User must have AT LEAST ONE permission in `list`
- Empty `list` or absent `perms` = no restriction

---

### NavLayoutMode

Layout mode type.

```typescript
type NavLayoutMode = 'sidebar' | 'top-menu'
```

**Source**: Read from `process.env.NEXT_PUBLIC_NAV_LAYOUT`

**Default**: `'sidebar'` (when env var is absent, empty, or invalid)

**Behavior**:
- `'sidebar'` — Renders collapsible sidebar (implemented)
- `'top-menu'` — Logs console warning, falls back to sidebar (stub for future)

---

## Relationships

```
MenuConfig
├── features: FeatureItem[]
│   └── submenu?: SubMenuItem[]
│       └── perms?: PermRule
│   └── perms?: PermRule
└── settings: SettingsItem[]
    └── perms?: PermRule
```

- `MenuConfig` 1:N `FeatureItem`
- `FeatureItem` 1:N `SubMenuItem` (optional)
- `MenuConfig` 1:N `SettingsItem`
- All item types optionally contain `PermRule`

---

## User Session Data (External)

The filtering logic requires user session data. This is provided by the existing auth system:

```typescript
type LaravelAppUser = {
  // ... other fields
  roles: string[]
  permissions: string[]
}
```

**Usage**:
- `roles` — Checked against item `display` arrays (ANY match)
- `permissions` — Checked against item `perms.list` (ALL or ANY based on mode)

---

## Icon Mapping

Icons are stored as kebab-case strings in JSON and resolved to Lucide React components.

**Transformation**: `kebab-case` → `PascalCase` → lookup in static map

**Example**:
- JSON: `"circle-user"` → Lookup: `"CircleUser"` → Component: `CircleUser`

**Fallback**: `Circle` (generic dot icon) when name is unrecognized

**Expected Icons** (initial map):
- `terminal`, `bot`, `book-open`, `settings-2`, `folder`
- `sparkles`, `circle-user`, `credit-card`, `bell`, `log-out`
- `layout`, `trending-up`, `map`, `more-horizontal`, `cpu`

---

## Type File Location

All types defined in:

```
src/lib/api/domains/menu/contract.ts
```

Exported for use by:
- `src/lib/api/domains/menu/queries.ts`
- `src/hooks/menu/useMenuConfig.ts`
- `src/lib/menu/filter.ts`
- `src/components/nav-main.tsx`
- `src/components/nav-user.tsx`
- `src/components/app-sidebar.tsx`
