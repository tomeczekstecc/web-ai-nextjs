# Zustand Store Pattern

## Overview

The app uses a single **app-scoped Zustand store** (`useStore`) for client-side global state that must survive across route navigations, be shared between unrelated components, or cannot be colocated in a React subtree.

The store is composed from **slices** — one file per domain — and wired into a single `create()` call with the `devtools` middleware. All slices and types are under `src/lib/store/`.

> **Zustand is for client-only state.** Server data belongs in TanStack Query. Local component state belongs in `useState`. Only reach for the store when state must cross component-tree boundaries and persist across navigations.

---

## File Map

```text
src/lib/store/
├── index.ts            ← single create() call, exports useStore
├── types.ts            ← all slice interfaces + StoreState union type
└── wizard.slice.ts     ← one slice per domain
```

Add new slices alongside `wizard.slice.ts`. **Do not split the store into multiple `create()` calls** — one store, many slices.

---

## Store Structure

### `src/lib/store/types.ts`

Declare each slice interface here, then union them into `StoreState`:

```ts
// Existing
export type ValidationItem = {
  key: string
  type: 'error' | 'warning'
  msgs: string[]
}

export type WizardEntry = {
  form: Record<string, unknown>
  meta: { validation: ValidationItem[] }
}

export type WizardSlice = {
  wizards: Record<string, WizardEntry>
  setWizardData: (name: string, data: Record<string, unknown>) => void
  setWizardValidation: (name: string, items: ValidationItem[]) => void
  clearWizard: (name: string) => void
}

// Add new slices here, then extend StoreState:
export type StoreState = WizardSlice // & NewSlice & AnotherSlice
```

### `src/lib/store/index.ts`

Single `create()` — spread all slices, keep `devtools` as the only middleware:

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createWizardSlice } from './wizard.slice'
import type { StoreState } from './types'

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
      // ...createNewSlice(...a),
    }),
    { name: 'ci-prs-store' }
  )
)
```

---

## Adding a New Slice

### 1. Declare the interface in `types.ts`

```ts
// src/lib/store/types.ts
export type UiSlice = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export type StoreState = WizardSlice & UiSlice
```

### 2. Create the slice file

```ts
// src/lib/store/ui.slice.ts
import type { StateCreator } from 'zustand'
import type { StoreState, UiSlice } from './types'

export const createUiSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  UiSlice
> = (set) => ({
  sidebarCollapsed: false,

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }, false, 'ui/setSidebarCollapsed'),

  toggleSidebar: () =>
    set(
      (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
      false,
      'ui/toggleSidebar'
    ),
})
```

### 3. Register in `index.ts`

```ts
import { createUiSlice } from './ui.slice'

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
      ...createUiSlice(...a),         // ← add here
    }),
    { name: 'ci-prs-store' }
  )
)
```

---

## Consuming the Store

`useStore` is a React hook — **only call it in Client Components** (`"use client"`).

### Single value (primitive)

```tsx
"use client";
import { useStore } from '@/lib/store';

export function SidebarToggle() {
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);

  return (
    <button onClick={toggle}>
      {collapsed ? 'Expand' : 'Collapse'}
    </button>
  );
}
```

### Multiple values — use `useShallow` to avoid unnecessary re-renders

When selecting multiple fields, wrap the selector with `useShallow` so the component only re-renders when the selected values change shallowly — not on every unrelated state update:

```tsx
"use client";
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

export function WizardStatus({ name }: { name: string }) {
  const { form, validation } = useStore(
    useShallow((s) => ({
      form: s.wizards[name]?.form,
      validation: s.wizards[name]?.meta.validation ?? [],
    }))
  );

  return (
    <div>
      <pre>{JSON.stringify(form, null, 2)}</pre>
      {validation.map((v) => (
        <p key={v.key} className={v.type === 'error' ? 'text-destructive' : 'text-warning'}>
          {v.msgs.join(', ')}
        </p>
      ))}
    </div>
  );
}
```

### Actions only (no state subscription)

Select only the action to avoid re-renders when state changes:

```tsx
"use client";
import { useStore } from '@/lib/store';

export function ClearWizardButton({ name }: { name: string }) {
  const clearWizard = useStore((s) => s.clearWizard);

  return <button onClick={() => clearWizard(name)}>Reset</button>;
}
```

---

## Action Naming Convention

Every `set()` call must include a descriptive action name as the third argument. This is visible in Redux DevTools and makes time-travel debugging readable.

**Format:** `'slice/actionName'`

```ts
// ✅ Good
set({ sidebarCollapsed: true }, false, 'ui/setSidebarCollapsed')
set((s) => ({ count: s.count + 1 }), false, 'counter/increment')

// ❌ Bad — no action name, invisible in DevTools
set({ sidebarCollapsed: true })
set((s) => ({ count: s.count + 1 }), false)
```

The second argument (`false`) means **do not replace** the whole state — always use `false` for partial updates.

---

## TypeScript Rules

- **Always use `StateCreator<StoreState, [['zustand/devtools', never]], [], SliceType>`** as the type for every slice creator. The middleware type parameters must match the store's middleware stack.
- **Never use `any` in slice types** — use `unknown` for dynamic data payloads (e.g. `Record<string, unknown>` for wizard form data).
- **Export the slice interface from `types.ts`**, not from the slice file itself.
- **`StoreState` is the union of all slice types** — always update it when adding a new slice.

---

## Key Rules

- **One store, many slices** — never call `create()` more than once. All global state lives in `useStore`.
- **Client Components only** — `useStore` is a hook; it cannot be called in Server Components, `layout.tsx`, or `page.tsx` files that are not marked `"use client"`.
- **Server state goes in TanStack Query** — data fetched from the API belongs in `useQuery` / `useMutation`, not in the store. Use Zustand only for UI state, wizard progress, multi-step form state, and similar client-only concerns.
- **Always select with a selector** — never call `useStore()` without a selector function. Subscribing to the whole store causes the component to re-render on every state change anywhere.
- **`useShallow` for object/array selectors** — any selector that returns a new object or array literal on every call needs `useShallow` to prevent infinite re-renders.
- **Action names are required** — always pass the `'slice/actionName'` string as the third argument to `set()`.
- **Keep slices focused** — one slice per domain (wizard, ui, auth, notifications, etc.). Do not put unrelated state in the same slice.

---

## Anti-Patterns

```tsx
// ❌ Calling useStore without a selector — re-renders on every state change
const store = useStore();
const collapsed = store.sidebarCollapsed;

// ✅ Selector-based subscription
const collapsed = useStore((s) => s.sidebarCollapsed);
```

```tsx
// ❌ Multiple values without useShallow — creates a new object every render
const { form, validation } = useStore((s) => ({
  form: s.wizards[name]?.form,
  validation: s.wizards[name]?.meta.validation,
}));

// ✅ Wrap with useShallow
import { useShallow } from 'zustand/react/shallow';

const { form, validation } = useStore(
  useShallow((s) => ({
    form: s.wizards[name]?.form,
    validation: s.wizards[name]?.meta.validation,
  }))
);
```

```tsx
// ❌ Using Zustand for server data
const data = useStore((s) => s.applications); // fetched from API
// ✅ Use TanStack Query for server data
const { data } = useQuery(getApplicationsQueryOptions());
```

```tsx
// ❌ Calling useStore in a Server Component
// src/app/(app)/dashboard/page.tsx
export default async function DashboardPage() {
  const collapsed = useStore((s) => s.sidebarCollapsed); // ❌ throws
}

// ✅ Only in "use client" components
"use client";
export function DashboardSidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed); // ✅
}
```

```ts
// ❌ Missing action name in set()
setSidebarCollapsed: (collapsed) =>
  set({ sidebarCollapsed: collapsed }),

// ✅ Action name included
setSidebarCollapsed: (collapsed) =>
  set({ sidebarCollapsed: collapsed }, false, 'ui/setSidebarCollapsed'),
```
