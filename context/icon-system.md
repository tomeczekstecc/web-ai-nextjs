# Icon System

How icons are resolved, sized, and made accessible in this repository. All icon usage goes through the central registry at `src/lib/icons.ts` — components never import directly from `lucide-react`.

---

## Central Icon Registry

**Rule:** All icon usage must go through the central icon registry at `src/lib/icons.ts`. Do not import icons directly from `lucide-react` in components — always use `resolveIcon()`.

This ensures:
- Consistent icon usage across the app
- Single source of truth for available icons
- Easy refactoring if icon library changes
- Fallback handling for missing icons

```tsx
// ✅ Correct — always use the registry
import { resolveIcon } from "@/lib/icons";

// Resolve once at module scope (avoids re-resolving on every render)
const ArrowRight = resolveIcon("ArrowRight");

function NavButton() {
  return (
    <Button>
      <ArrowRight />
      Continue
    </Button>
  );
}

function MenuItem({ iconName }: { iconName: string }) {
  const Icon = resolveIcon(iconName);  // "arrow-right" → ArrowRight (with fallback)
  return <Icon className="h-4 w-4" />;
}

// ❌ Wrong — direct import from lucide-react
import { ArrowRight, Settings } from "lucide-react";

// ❌ Wrong — dynamic import without registry
import * as Icons from "lucide-react";
const Icon = Icons[iconName];
```

## Usage

```tsx
import { resolveIcon } from "@/lib/icons";

// From data (kebab-case)
const Icon = resolveIcon("layout-dashboard");  // → LayoutDashboard

// Hardcoded (PascalCase with autocomplete)
const Icon = resolveIcon("LayoutDashboard");   // → LayoutDashboard

// Unknown icon falls back to Circle
const Icon = resolveIcon("unknown");           // → Circle
```

## Registry API

| Function | Purpose |
|----------|--------|
| `resolveIcon(name)` | Resolve icon name to component. Accepts kebab-case, snake_case, or PascalCase. Returns `Circle` fallback if not found. Has TypeScript autocomplete on registered names. |
| `getIconNames()` | List all registered icon names (useful for icon pickers). |
| `isIconName(name)` | Type guard for checking if a string is a valid icon name. |
| `FallbackIcon` | The fallback component (`Circle`) used when resolution fails. |

## Adding Icons to the Registry

When a feature needs dynamic resolution of a new icon:

1. Import the icon from `lucide-react` in `src/lib/icons.ts`
2. Add it to the `iconRegistry` object under the appropriate category
3. The icon is now available via `resolveIcon("icon-name")`

```ts
// src/lib/icons.ts
import { NewIcon } from "lucide-react";

const iconRegistry = {
  // ... existing icons
  NewIcon,
};
```

## Icon Sizing Convention

| Context | Size | Class |
|---------|------|-------|
| Inline with text | 16px | `h-4 w-4` |
| Button icons | 16px | `h-4 w-4` |
| Nav items | 16–20px | `h-4 w-4` or `h-5 w-5` |
| Empty states | 48px | `h-12 w-12` |
| Hero/feature | 64px+ | `h-16 w-16` or larger |

## Icon Accessibility

```tsx
// Decorative icon (label provides meaning)
<Button>
  <ArrowRight className="h-4 w-4" aria-hidden="true" />
  Continue
</Button>

// Icon-only button (needs accessible label)
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="h-4 w-4" />
</Button>

// Status icon (convey meaning via sr-only text)
<span className="flex items-center gap-2">
  <CircleCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
  <span>Completed</span>
</span>
```

## Related

- `button-patterns.md` — icon-only button + tooltip pattern
- `accessibility.md` — broader a11y rules
