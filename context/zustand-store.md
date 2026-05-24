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

---

## Best Practices

> Source: [Zustand Best Practices — YouTube](https://www.youtube.com/watch?v=6tEQ1nJZ51w)

---

### 1. Preventing unnecessary component re-renders

Every `useStore(selector)` call subscribes the component to exactly the slice of state the selector returns. The component re-renders **only when that value changes** (strict equality check).

**Rules:**
- Always pass a selector — never call `useStore()` naked.
- Return primitives where possible; they compare by value and never trigger spurious re-renders.
- For derived objects/arrays, wrap with `useShallow` (see §2 below).
- Extract actions via a separate `useStore(s => s.action)` call so the component is never re-rendered when unrelated state mutates.

```tsx
// ✅ Primitive selector — re-renders only when `count` changes
const count = useStore((s) => s.count)

// ✅ Action-only selector — never causes a re-render
const increment = useStore((s) => s.increment)
```

---

### 2. Atomic selectors with `useShallow` for better performance

When a selector returns a **new object or array reference** on every call, Zustand's default equality check (`===`) sees it as changed every render, causing an infinite re-render loop.

**Fix:** wrap with `useShallow` from `zustand/react/shallow` for shallow (one-level) equality, or provide a custom `equalityFn` for deep structures.

```tsx
import { useShallow } from 'zustand/react/shallow'

// ✅ Shallow equality — only re-renders when form or validation values change
const { form, validation } = useStore(
  useShallow((s) => ({
    form: s.wizards[name]?.form,
    validation: s.wizards[name]?.meta.validation ?? [],
  }))
)
```

**Atomic selectors** — prefer selecting the smallest useful unit:

```tsx
// ✅ Atomic: two separate subscriptions, each re-renders independently
const count  = useStore((s) => s.counter.count)
const status = useStore((s) => s.counter.status)

// ❌ Combined object — always a new reference, requires useShallow
const { count, status } = useStore((s) => s.counter)
```

---

### 3. Actions and state separation

Keep **state** (data) and **actions** (functions that mutate state) clearly separated inside a slice. The recommended pattern is grouping actions under a nested `actions` key, or simply declaring them flat but using the naming convention `verb + noun`.

```ts
// src/lib/store/counter.slice.ts

export type CounterSlice = {
  // — state —
  count: number
  status: 'idle' | 'busy'

  // — actions —
  increment: () => void
  decrement: () => void
  reset: () => void
  setStatus: (s: 'idle' | 'busy') => void
}

export const createCounterSlice: StateCreator<StoreState, [['zustand/devtools', never]], [], CounterSlice> =
  (set) => ({
    count: 0,
    status: 'idle',

    increment: () => set((s) => ({ count: s.count + 1 }), false, 'counter/increment'),
    decrement: () => set((s) => ({ count: s.count - 1 }), false, 'counter/decrement'),
    reset:     () => set({ count: 0, status: 'idle' },    false, 'counter/reset'),
    setStatus: (status) => set({ status },                false, 'counter/setStatus'),
  })
```

**Rules:**
- Actions live in the slice alongside state — do **not** define them outside `create()`.
- Never mutate state directly; always go through `set()`.
- Complex multi-step mutations should call `get()` to read current state before setting:

```ts
import type { StateCreator } from 'zustand'

// get() lets you read current state without subscribing
const createCounterSlice: StateCreator<...> = (set, get) => ({
  doubleIncrement: () => {
    const current = get().count
    set({ count: current + 2 }, false, 'counter/doubleIncrement')
  },
})
```

---

### 4. Using middleware to enhance Zustand

The store already uses `devtools`. These are the middlewares worth knowing:

| Middleware | Import | Purpose |
|---|---|---|
| `devtools` | `zustand/middleware` | Redux DevTools integration; **always on in dev** |
| `persist` | `zustand/middleware` | Serialise slice to `localStorage` / `sessionStorage` |
| `immer` | `zustand/middleware/immer` | Write mutations as if state is mutable (Immer under the hood) |
| `subscribeWithSelector` | `zustand/middleware` | `subscribe(selector, callback)` outside React |

**Adding `persist` to a slice** (e.g. user preferences):

```ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { StoreState } from './types'

// Wrap only the slice that needs persistence — not the whole store.
// Recommended: create a separate small store for persisted preferences
// rather than mixing persist + devtools on the main store.
export const usePrefsStore = create<PrefsSlice>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        setTheme: (theme) => set({ theme }, false, 'prefs/setTheme'),
      }),
      { name: 'app-prefs' } // localStorage key
    ),
    { name: 'prefs-store' }
  )
)
```

> **Convention for this project:** the main `useStore` stays `devtools`-only. If a slice needs persistence, extract it into its own `create()` call in `src/lib/store/<domain>.store.ts` and document it in `types.ts`.

**Middleware ordering** — innermost runs first:
```ts
create()(devtools(persist(immer(fn), persistOpts), devtoolsOpts))
//         outer       middle  inner
```

---

### 5. Scaling Zustand in a large React project

| Concern | Recommendation |
|---|---|
| **File layout** | One slice per domain under `src/lib/store/`. Types in `types.ts`, single `create()` in `index.ts`. |
| **Selector co-location** | Export named selectors (`selectWizardForm`, `selectGenerationState`) from the slice file when used in ≥ 2 components. |
| **Derived state** | Compute in the selector, not in the slice. Keep state minimal; derive in the component or a shared selector hook. |
| **Async actions** | Handle async in the calling hook (TanStack mutation), not inside `set()`. Write result to the store only for UI state (e.g. `generationState`). |
| **Testing** | Reset slices between tests with `useStore.setState(initialState, true)`. The `true` flag replaces (not merges) state. |
| **DevTools** | Name every `set()` call `'slice/action'` — it's the only way time-travel debugging stays readable at scale. |

**Named selectors pattern (for frequently shared state):**

```ts
// src/lib/store/reports.slice.ts
export const selectGenerationState =
  (reportId: number) => (s: StoreState) =>
    s.generationStates[reportId] ?? 'idle'

// usage in component
const state = useStore(selectGenerationState(report.id))
```

**Store reset utility (useful in tests and logout flows):**

```ts
// src/lib/store/index.ts
export function resetStore() {
  useStore.setState(initialState, true)
}
```
