# API Contract: Menu Configuration

**Endpoint**: `GET /api/config/menu`
**Version**: 1.0
**Date**: 2026-05-12

## Overview

Returns the navigation menu configuration for the authenticated user's application. The frontend uses this data to render the sidebar navigation and user settings dropdown.

## Request

### HTTP Method
`GET`

### URL
```
${API_BASE_URL}/api/config/menu
```

### Headers
| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer {token}` | Yes |
| `Accept` | `application/json` | Yes |

### Query Parameters
None

### Request Body
None

## Response

### Success (200 OK)

```json
{
  "features": [
    {
      "key": "playground",
      "label": "Playground",
      "icon": "terminal",
      "display": ["user"],
      "perms": {
        "list": ["playground_view"],
        "mode": "all"
      },
      "submenu": [
        {
          "key": "history",
          "label": "History",
          "to": "/playground/history",
          "perms": {
            "list": ["playground_view"],
            "mode": "all"
          }
        },
        {
          "key": "starred",
          "label": "Starred",
          "to": "/playground/starred",
          "perms": {
            "list": ["playground_view"],
            "mode": "all"
          }
        }
      ]
    },
    {
      "key": "dashboard",
      "label": "Dashboard",
      "icon": "layout-dashboard",
      "to": "/dashboard",
      "display": ["user", "admin"],
      "perms": {
        "list": ["dashboard_view"],
        "mode": "all"
      }
    }
  ],
  "settings": [
    {
      "key": "account",
      "label": "Account",
      "icon": "circle-user",
      "to": "/account",
      "display": ["user"],
      "perms": {
        "list": ["account_view"],
        "mode": "all"
      }
    },
    {
      "key": "logout",
      "label": "Log out",
      "icon": "log-out",
      "action": "logout",
      "display": ["user"]
    }
  ]
}
```

### Response Schema

```typescript
{
  features: Array<{
    key: string           // Unique identifier
    label: string         // Display text
    icon: string          // Lucide icon name (kebab-case)
    to?: string           // Direct navigation route
    submenu?: Array<{     // Nested items (if collapsible group)
      key: string
      label: string
      to: string          // Required for sub-items
      icon?: string       // Optional icon
      perms?: {
        list: string[]
        mode?: "all" | "any"
      }
    }>
    display?: string[]    // Roles that see this item
    perms?: {
      list: string[]      // Required permissions
      mode?: "all" | "any"  // Default: "all"
    }
  }>
  settings: Array<{
    key: string
    label: string
    icon: string
    to?: string           // Navigation route
    action?: string       // Action identifier (e.g., "logout")
    display?: string[]
    perms?: {
      list: string[]
      mode?: "all" | "any"
    }
  }>
}
```

### Error Responses

| Status | Description | Response Body |
|--------|-------------|---------------|
| 401 | Unauthorized | `{ "message": "Unauthenticated." }` |
| 500 | Server Error | `{ "message": "Internal server error" }` |

## Filtering Behavior

The response contains ALL menu items. The frontend is responsible for filtering based on:

1. **Role filtering** (`display` field):
   - If `display` is absent or empty → visible to all
   - If `display` is present → user must have ANY role in the array

2. **Permission filtering** (`perms` field):
   - If `perms` is absent → no restriction
   - If `perms.mode` is `"all"` (default) → user must have ALL permissions
   - If `perms.mode` is `"any"` → user must have AT LEAST ONE permission

3. **Parent pruning**:
   - If all sub-items are filtered out, parent is also hidden

## Icon Names

Icons use Lucide icon names in kebab-case format.

**Valid examples**:
- `terminal`
- `circle-user`
- `log-out`
- `layout-dashboard`
- `book-open`

**Frontend resolution**:
1. Convert kebab-case to PascalCase
2. Look up in static icon map
3. Fall back to `Circle` if not found

## Caching

- **Cache key**: `['menu', 'config']`
- **Stale time**: `Infinity` (never auto-refetch)
- **Refetch triggers**: Page reload (sign-in/sign-out redirects)
- **Window focus refetch**: Disabled

## MSW Mock

During development, MSW intercepts this endpoint and returns fixture data from `src/mocks/data/menu.ts`.

```typescript
// Handler registration
http.get("*/api/config/menu", () => {
  return HttpResponse.json(menuConfigFixture)
})
```

## Future Considerations

- **Versioning**: If the schema changes significantly, consider adding a version field or using URL versioning (`/api/v2/config/menu`)
- **Localization**: Labels are currently Polish. If multi-language support is added, the backend would return localized labels based on user preferences.
- **Real-time updates**: Currently not supported. If menu changes need to propagate without page reload, consider WebSocket or polling.
