# Quickstart: JSON-Driven Navigation Menu Generator

**Feature**: 014-json-menu-gen
**Date**: 2026-05-12

## What This Feature Does

Replaces hardcoded navigation data in the sidebar with a server-driven system. Menu items, icons, labels, and permission rules come from a JSON API response. Changes to navigation no longer require frontend deployments.

## Key Files

| Purpose | Location |
|---------|----------|
| Types | `src/lib/api/domains/menu/contract.ts` |
| API fetch | `src/lib/api/domains/menu/client.ts` |
| Query hook | `src/hooks/menu/useMenuConfig.ts` |
| Icon resolver | `src/lib/menu/icons.ts` |
| Filter utilities | `src/lib/menu/filter.ts` |
| Env helper | `src/lib/menu/env.ts` |
| MSW fixture | `src/mocks/data/menu.ts` |
| MSW handler | `src/mocks/handlers/menu.ts` |

## Quick Usage

### Reading Menu Data in a Component

```tsx
import { useMenuConfig } from '@/hooks/menu/useMenuConfig'

function MyComponent() {
  const { data: menuConfig, isLoading, isError } = useMenuConfig()

  if (isLoading) return <Skeleton />
  if (isError || !menuConfig) return null

  return (
    <nav>
      {menuConfig.features.map(item => (
        <NavItem key={item.key} item={item} />
      ))}
    </nav>
  )
}
```

### Filtering Menu Items

```tsx
import { filterFeatures, filterSettings } from '@/lib/menu/filter'

const visibleFeatures = filterFeatures(
  menuConfig.features,
  user.permissions,  // string[]
  user.roles         // string[]
)

const visibleSettings = filterSettings(
  menuConfig.settings,
  user.permissions,
  user.roles
)
```

### Resolving Icons

```tsx
import { resolveIcon } from '@/lib/menu/icons'

function NavItem({ item }: { item: FeatureItem }) {
  const Icon = resolveIcon(item.icon)
  return (
    <div>
      <Icon className="size-4" />
      <span>{item.label}</span>
    </div>
  )
}
```

### Checking Layout Mode

```tsx
import { getNavLayout } from '@/lib/menu/env'

const layout = getNavLayout() // 'sidebar' | 'top-menu'
```

## Adding New Menu Items

1. Edit the MSW fixture at `src/mocks/data/menu.ts`
2. Add entry to `features` or `settings` array
3. If using a new icon, add it to the map in `src/lib/menu/icons.ts`
4. Refresh the page

Example new feature item:
```typescript
{
  key: 'reports',
  label: 'Raporty',
  icon: 'file-bar-chart',
  to: '/reports',
  display: ['admin'],
  perms: { list: ['reports_view'], mode: 'all' }
}
```

## Adding New Icons

1. Open `src/lib/menu/icons.ts`
2. Import the icon from `lucide-react`
3. Add to the `iconMap` object

```typescript
import { FileBarChart } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  // ... existing icons
  FileBarChart,
}
```

## Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `NEXT_PUBLIC_NAV_LAYOUT` | `sidebar`, `top-menu` | `sidebar` | Controls which navigation layout renders |

## Testing Changes

1. **Menu structure**: Change fixture, refresh page, verify sidebar updates
2. **Permissions**: Modify mock user permissions in auth mock, verify items hide/show
3. **Active state**: Navigate to different routes, verify correct item highlights
4. **Icons**: Use an invalid icon name, verify fallback renders (no crash)
5. **Error state**: Temporarily break the MSW handler, verify empty sidebar (no crash)

## Common Tasks

### Add a new feature section with sub-items

```typescript
// In src/mocks/data/menu.ts
{
  key: 'analytics',
  label: 'Analityka',
  icon: 'bar-chart-2',
  display: ['user'],
  perms: { list: ['analytics_view'], mode: 'all' },
  submenu: [
    { key: 'overview', label: 'Przegląd', to: '/analytics/overview' },
    { key: 'reports', label: 'Raporty', to: '/analytics/reports' }
  ]
}
```

### Add a new settings action

```typescript
// In src/mocks/data/menu.ts (settings array)
{
  key: 'export-data',
  label: 'Eksportuj dane',
  icon: 'download',
  action: 'export-data',  // Handle in nav-user.tsx
  display: ['user']
}
```

Then in `nav-user.tsx`, add handler for the new action.

### Hide an item from specific roles

```typescript
{
  key: 'admin-panel',
  label: 'Panel admina',
  icon: 'shield',
  to: '/admin',
  display: ['admin'],  // Only visible to admin role
  perms: { list: ['admin_access'], mode: 'all' }
}
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Sidebar empty | MSW not running or handler error | Check browser console, verify MSW initialized |
| Icon shows circle | Icon name not in map | Add icon to `src/lib/menu/icons.ts` |
| Item not visible | Permission/role filter | Check user session has required perms/roles |
| Console warning about invalid item | Feature item missing `to` and `submenu` | Add either `to` or `submenu` to the item |
