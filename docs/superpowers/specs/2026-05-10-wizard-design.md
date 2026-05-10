# Wizard System Design

**Date:** 2026-05-10
**Status:** Approved
**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · TanStack Query · Zustand · MSW

---

## What We're Building

A reusable, generic multi-step form wizard engine for the CI-PRS web platform. It replaces the React Bootstrap + Redux + `cloneElement` pattern from the reference implementation (`eMP_web`) with an idiomatic Next.js App Router / shadcn/ui stack, while preserving the full feature set of the original.

The wizard is a **shared component system** — it has no forced first consumer but is designed so any domain can wire up a multi-step form with minimal boilerplate.

---

## Decisions Log

| Question | Decision |
|---|---|
| Consumer scope | Generic reusable system — no forced first consumer |
| Field metadata source | Server-driven (`mappingUrl`), MSW-mocked |
| Form state store | Zustand global store, wizard as first slice |
| Save behavior | Hybrid: `saveOnPageChange` flag + explicit Save + Save and Quit |
| Validation | Client-first Zod per page + server 422 on summary |
| Navigation layout | Vertical side nav (pill links on left) |
| Page API pattern | React context + `useWizard()` hook (no prop drilling) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Consumer layer                                      │
│  <Wizard> + page components (StartPage, etc.)        │
│  Page components call useWizard() — no wiz props     │
├─────────────────────────────────────────────────────┤
│  Engine layer                                        │
│  WizardProvider → WizardContext                      │
│  Zustand global store (wizard slice, keyed by name)  │
│  Navigation state, form draft, validation state      │
├─────────────────────────────────────────────────────┤
│  Data layer                                          │
│  TanStack Query: mapping fetch, data fetch, save     │
│  MSW handlers for all three endpoint types           │
└─────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── lib/
│   ├── store/
│   │   ├── index.ts              ← global Zustand store (merges all slices)
│   │   ├── wizard.slice.ts       ← wizard state slice (keyed by wizard name)
│   │   └── types.ts              ← shared StoreState type
│   └── wizard/
│       ├── types.ts              ← WizardPage, WizardConfig, WizardAPI, FieldMeta, ValidationItem
│       └── validation.ts         ← Zod helpers, 422 response parser
│
├── hooks/wizard/
│   ├── useWizard.ts              ← consumer hook (reads WizardContext)
│   ├── useWizardField.ts         ← escape-hatch hook for custom inputs (label, value, onChange, hidden, disabled, error)
│   ├── useWizardMapping.ts       ← TQ query for server field mapping
│   ├── useWizardData.ts          ← TQ query for initial form data
│   └── useWizardSave.ts          ← TQ mutation for save / save-and-quit
│
├── components/wizard/
│   ├── Wizard.tsx                ← shell: layout, side nav, nav buttons
│   ├── WizardProvider.tsx        ← context provider + Zustand wiring
│   ├── WizardSummary.tsx         ← summary/validation page component
│   ├── ValidationWrapper.tsx     ← internal: border + alert + scroll anchor (not public API)
│   └── inputs/
│       ├── InputWiz.tsx          ← label + Input + ValidationWrapper, self-contained
│       ├── SelectWiz.tsx         ← label + Select + ValidationWrapper, self-contained
│       ├── TextareaWiz.tsx       ← label + Textarea + ValidationWrapper, self-contained
│       ├── DateTimeWiz.tsx       ← label + date picker + ValidationWrapper, self-contained
│       └── RadioWiz.tsx          ← label + RadioGroup + ValidationWrapper, self-contained
│
└── mocks/
    └── handlers/
        └── wizard.ts             ← MSW handlers: mapping, data, save, validation
```

The wizard slice is the first entry in the global store. Future slices (notifications, sidebar, etc.) land in `src/lib/store/` and get merged into `index.ts` — no wizard code changes.

---

## Layer Designs

### 1. Global Zustand Store

**`src/lib/store/wizard.slice.ts`**

Keyed by wizard `name`. Multiple wizard instances coexist without interference.

```ts
type WizardEntry = {
  form: Record<string, unknown>
  meta: { validation: ValidationItem[] }
}

type WizardSlice = {
  wizards: Record<string, WizardEntry>
  setWizardData:       (name: string, data: Record<string, unknown>) => void
  setWizardValidation: (name: string, items: ValidationItem[]) => void
  clearWizard:         (name: string) => void
}
```

**`src/lib/store/index.ts`** — single store instance combining all slices, with Redux DevTools enabled:

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
      // future slices here
    }),
    { name: 'ci-prs-store' }
  )
)
```

The `devtools` middleware connects to the Redux DevTools browser extension — no additional extension required. Slice actions should pass a descriptive label as the third argument to `set` so they appear clearly in the DevTools action log:

```ts
set({ wizards: { ... } }, false, 'wizard/setData')
set({ wizards: { ... } }, false, 'wizard/setValidation')
set({ wizards: { ... } }, false, 'wizard/clear')
```

DevTools is active in development only — in production the middleware is a no-op.

---

### 2. Engine Layer

**`src/components/wizard/WizardProvider.tsx`**

- Accepts the full `WizardConfig` (name, pages, URLs, mode, callbacks, flags)
- Fetches mapping via `useWizardMapping` on mount
- Fetches initial form data via `useWizardData`; writes result into Zustand slice
- Owns local navigation state: `page` (index), `pageKey` (name), `busy`, `loading`
- On summary page: calls `validationUrl` to retrieve server-side 422 result
- Clears its Zustand slice on unmount
- Assembles `WizardAPI` and pushes it into `WizardContext`

**`src/hooks/wizard/useWizard.ts`**

```ts
export function useWizard<T = Record<string, unknown>>(): WizardAPI<T>
```

Throws a descriptive error if called outside a `WizardProvider`.

**`WizardAPI<T>` shape:**

```ts
type WizardAPI<T> = {
  // form state
  form: T
  setValue:   (key: keyof T, value: unknown) => void
  setForm:    (form: T) => void
  appendData: (page: string, data: unknown) => void
  clearFields:(fields: (keyof T)[]) => void

  // mapping helpers
  mapping:    PageMapping[]
  getLabel:   (field: string, page?: string) => string
  getType:    (field: string, page?: string) => FieldType
  getDisplay: (field: string, page?: string) => boolean
  getMax:     (field: string, page?: string) => number | undefined
  getDecimal: (field: string, page?: string) => number

  // navigation
  page:          number
  pageKey:       string
  setPageByName: (name: string, scrollTo?: string) => void

  // validation
  validation:    ValidationItem[]
  setValidation: (items: ValidationItem[]) => void
  summary:       SummaryResult | null

  // state
  mode:         'view' | 'edit'
  loading:      boolean
  busy:         boolean
  refetch:      () => void
}
```

---

### 3. Data Layer

**Server-driven field mapping**

Each wizard declares a `mappingUrl`. The server returns an array of page descriptors:

```ts
type PageMapping = {
  name:   string
  label:  string
  fields: FieldMeta[]
}

type FieldMeta = {
  name:    string
  label:   string
  type:    'input' | 'select' | 'textarea' | 'date' | 'radio' | 'checkbox'
  lp:      number
  display: boolean
  max?:    number
  decimal?: number
}
```

`useWizardMapping` fetches this once on wizard mount and caches it via TanStack Query. The MSW handler returns static fixture data for development.

**Initial data fetch**

`useWizardData` fetches from `dataUrl` on wizard mount. On success it writes the flat result into the Zustand wizard slice and sets `busy = false`.

**Save mutation**

`useWizardSave` sends a `PUT` to `saveUrl` with the full flat form as payload. On `status: 'success'` it fires a sonner toast. The mutation is used for:
- Save (stay on page)
- Save and Quit (save → `saveAndQuitCallback()`)
- Auto-save on page change (when `saveOnPageChange: true` and `mode === 'edit'`)

---

### 4. UI Layer

**`src/components/wizard/Wizard.tsx`** — shell layout:

```
┌──────────────┬──────────────────────────────────┐
│ Side nav     │ [← Back] [Cancel] [Save ▾] [Next→]│
│              ├──────────────────────────────────┤
│ ① Start      │                                  │
│ ② Basic Data │   <current page component>       │
│ ③ Contact    │                                  │
│ ④ Summary    │                                  │
│              ├──────────────────────────────────┤
│              │ [← Back] [Cancel] [Save ▾] [Next→]│
└──────────────┴──────────────────────────────────┘
```

- Side nav renders shadcn navigation pills from `mapping` data (labels come from server)
- Nav buttons appear top and bottom (sticky bottom)
- In `view` mode: all inputs disabled, "Read-only" badge instead of Save button
- Save button is a shadcn `DropdownMenu` split: primary action "Save", dropdown item "Save and Quit"
- On the last page: Save button is hidden; accept/submit buttons rendered via `acceptButtons` render prop
- `customButtons` render prop for additional last-page actions

**`src/components/wizard/ValidationWrapper.tsx`** — wraps any field:

```tsx
<ValidationWrapper field="subject">
  <InputWiz keyName="subject" />
</ValidationWrapper>
```

- Reads `validation` from `useWizard()`
- If the field has a validation item: renders a red border around children + shadcn `Alert` below
- Renders an anchor `id={pageKey + '.' + field}` for scroll-to from summary

---

### 5. Validation System

**Client-side (Zod, per page):**

Each `WizardPage` optionally declares a `schema: z.ZodSchema`. On Back/Next navigation, the engine validates the flat `form` against the schema. Errors map to `ValidationItem[]` and are written to the Zustand slice. Navigation is blocked on error.

**Server-side (summary page, 422):**

When the wizard navigates to a page with `isSummaryPage: true`, `WizardProvider` calls `validationUrl`. A 422 response body has the shape:

```ts
type SummaryResult = {
  error:    Record<string, string[]>   // fieldPath → messages
  warning:  Record<string, string[]>
  dicts_msg?: {
    error:   Record<string, string[]>
    warning: Record<string, string[]>
  }
}
```

`validation.ts` parses this into `ValidationItem[]` grouped by page.

**`src/components/wizard/WizardSummary.tsx`:**

- Shows a top-level status alert: Error / Warning / Success
- Groups errors and warnings by page (from `mapping`)
- Each group has a "Go to page" button → `setPageByName()`
- Each field error has a "Go to field" button → `setPageByName(page, scrollTo)` 
- Field errors and warnings de-duplicated (warning hidden if same key has an error)
- Dictionary-level errors (`dicts_msg`) shown in a separate section at the bottom
- Accept/submit buttons shown only when no errors remain

---

### 6. Field Binding

**Common case — Wiz components (self-contained):**

Each Wiz component internally calls `useWizardField(keyName)`, renders the server-mapped label, wraps itself in `ValidationWrapper`, and disables itself in view mode. Page authors write one line per field:

```tsx
export function StartPage() {
  return (
    <div className="flex flex-col gap-4">
      <InputWiz    keyName="title" />
      <SelectWiz   keyName="type" options={typeOptions} />
      <TextareaWiz keyName="description" />
    </div>
  )
}
```

`ValidationWrapper` is an **internal implementation detail** — page authors never import or use it directly.

**Conditional visibility** — the `hide` prop skips rendering entirely:

```tsx
<RadioWiz keyName="assignee_id" hide={form.type === 'personal'} options={assigneeOptions} />
```

**Custom input escape hatch — `useWizardField()`:**

For inputs that have no pre-built Wiz variant, `useWizardField(keyName)` exposes the same wiring that Wiz components use internally:

```tsx
const f = useWizardField('custom_field')
if (f.hidden) return null
// full control over rendering; validation display is the consumer's responsibility
return <MyCustomInput label={f.label} value={f.value} onChange={f.onChange} disabled={f.disabled} />
```

`useWizardField(keyName)` returns `{ label, value, onChange, hidden, disabled, error }` by reading `getLabel`, `getDisplay`, `form[keyName]`, `setValue`, `validation`, and `mode` from `useWizard()`.

**`calc` per page:** `WizardPage` accepts an optional `calc: (form: T) => T` function. After every `setValue`, the engine runs `calc` on the current form and writes the result back — enabling derived/computed fields without side effects.

---

## WizardPage Config Shape

```ts
type WizardPage<T = Record<string, unknown>> = {
  name:           string              // must match the page name in server mapping
  form:           React.ReactElement  // page component (no wiz props needed)
  disabled?:      boolean             // grey out this page in side nav (non-navigable)
  isSummaryPage?: boolean             // when true: triggers server validationUrl call on enter
  noPayload?:     boolean             // when true: skip PUT on save for this page (read-only pages)
  calc?:          (form: T) => T      // runs after every setValue — use for derived/computed fields
  schema?:        z.ZodSchema         // Zod schema validated on Back/Next — blocks navigation on failure
}
```

---

## WizardConfig (top-level `<Wizard>` props)

```ts
type WizardConfig<T = Record<string, unknown>> = {
  name:                string
  mode:                'view' | 'edit'
  pages:               WizardPage<T>[]
  mappingUrl:          string
  dataUrl:             string
  saveUrl?:            string
  validationUrl?:      string
  saveOnPageChange:    boolean
  addData?:            Record<string, unknown>
  acceptButtons?:      (summary: SummaryResult | null) => React.ReactNode
  customButtons?:      () => React.ReactNode
  saveAndQuitCallback?:() => void
  cancelCallback?:     () => void
}
```

---

## MSW Mock Handlers

`src/mocks/handlers/wizard.ts` exports three handler factories:

```ts
createWizardMappingHandler(url, pages: PageMapping[])
createWizardDataHandler(url, data: Record<string, unknown>)
createWizardSaveHandler(url)
createWizardValidationHandler(url, result: SummaryResult)
```

Each wizard feature in the app registers its own handlers by calling these factories and adding them to `src/mocks/handlers/index.ts`.

---

## Implementation Phases

### Phase 1 — Foundation (store + engine core)

**Scope:** The global Zustand store infrastructure and wizard engine with navigation. No data fetching, no field components, no validation — just a working multi-page shell.

**Deliverables:**
- `src/lib/store/types.ts` — `StoreState`, `ValidationItem`
- `src/lib/store/wizard.slice.ts` — `WizardSlice` implementation
- `src/lib/store/index.ts` — `useStore` combining all slices, `devtools` middleware wired to Redux DevTools extension
- `src/lib/wizard/types.ts` — `WizardPage`, `WizardConfig`, `WizardAPI`, `FieldMeta`, `SummaryResult`
- `src/components/wizard/WizardProvider.tsx` — context provider (no data fetching yet, hardcoded empty mapping)
- `src/hooks/wizard/useWizard.ts` — context consumer hook
- `src/components/wizard/Wizard.tsx` — shell with vertical side nav (shadcn nav pills), Back/Next buttons, page slot rendering
- `src/app/wizard-demo/page.tsx` — stub page with 2–3 hardcoded pages and no mapping (replaced in Phase 6)

**Exit criteria:** Side nav renders, clicking Back/Next changes the active page, form state persists between pages via Zustand, read-only mode shows disabled state.

---

### Phase 2 — Data Layer (TanStack Query + MSW)

**Scope:** Server-driven mapping, initial data fetch, and save mutation. The wizard becomes data-aware.

**Deliverables:**
- `src/hooks/wizard/useWizardMapping.ts` — TQ query, caches by `mappingUrl`
- `src/hooks/wizard/useWizardData.ts` — TQ query, fetches flat form data from `dataUrl`
- `src/hooks/wizard/useWizardSave.ts` — TQ mutation (save, save-and-quit, auto-save on nav)
- `WizardProvider.tsx` updated — wires mapping/data/save hooks, populates side nav labels from mapping, handles `saveOnPageChange` logic
- `src/mocks/handlers/wizard.ts` — `createWizardMappingHandler`, `createWizardDataHandler`, `createWizardSaveHandler`, `createWizardValidationHandler`
- `src/mocks/handlers/index.ts` updated — registers demo handlers
- Demo page updated — real mapping URL, real data URL, side nav labels from server

**Exit criteria:** Side nav labels come from MSW mapping response. Form pre-fills from MSW data response. Save fires a PUT and shows a sonner success toast.

---

### Phase 3 — Field Input Components

**Scope:** Self-contained Wiz input components and the `useWizardField()` escape-hatch hook. Each Wiz component is fully self-contained: it renders the server-mapped label, the shadcn input, and validation feedback — page authors write one line per field. `ValidationWrapper` is internal only.

**Deliverables:**
- `src/hooks/wizard/useWizardField.ts` — returns `{ label, value, onChange, hidden, disabled, error }` from `useWizard()` context; used internally by all Wiz components and exported as an escape hatch for custom inputs
- `src/components/wizard/ValidationWrapper.tsx` — **internal component**: red border on validation hit, shadcn `Alert` with error message, scroll anchor `id={pageKey + '.' + field}` for jump-to from summary; not exported as public API
- `src/components/wizard/inputs/InputWiz.tsx` — label + `Input` + `ValidationWrapper`; accepts `hide?: boolean`, `label?` override
- `src/components/wizard/inputs/SelectWiz.tsx` — label + `Select` + `ValidationWrapper`; accepts `options`, `hide?`
- `src/components/wizard/inputs/TextareaWiz.tsx` — label + `Textarea` + `ValidationWrapper`; accepts `hide?`
- `src/components/wizard/inputs/DateTimeWiz.tsx` — label + date picker + `ValidationWrapper`; accepts `hideTime?: boolean`, `hide?`
- `src/components/wizard/inputs/RadioWiz.tsx` — label + `RadioGroup` + `ValidationWrapper`; accepts `options`, `hide?`
- Demo page updated — all five Wiz components used across pages; one custom field using `useWizardField()` directly

**Exit criteria:** Each Wiz component renders its server-mapped label, writes to form state, hides itself when `hide` is true or `getDisplay()` returns false, disables in view mode, and shows inline validation feedback without any `ValidationWrapper` import in the page file.

---

### Phase 4 — Validation System

**Scope:** Client-side Zod validation per page and server-side 422-driven summary page.

**Deliverables:**
- `src/lib/wizard/validation.ts` — Zod runner, 422 response parser (`parseSummaryResult`)
- `WizardProvider.tsx` updated — runs page schema on nav, blocks navigation on error, calls `validationUrl` on summary page entry
- `src/components/wizard/WizardSummary.tsx` — status alert, errors/warnings grouped by page, "Go to page" / "Go to field" buttons, dict-level errors section
- MSW demo handler updated — returns a fixture `SummaryResult` with sample errors and warnings
- Demo page updated — summary page uses `WizardSummary`, Zod schema on one page

**Exit criteria:** Navigating away from a page with a failing Zod schema blocks navigation and shows inline errors. Summary page shows server errors grouped by page with working jump links.

---

### Phase 5 — Advanced Features

**Scope:** Remaining behavioral features: `calc`, conditional visibility, view mode polish, `acceptButtons`, `customButtons`, and `cancelCallback`.

**Deliverables:**
- `calc` runner in `setValue` — after every value change, runs `WizardPage.calc(form)` and writes the result back; enables derived/computed fields without side effects
- `clearFields(fields)` — removes specified keys from the flat form state; useful for resetting dependent fields when a controlling field changes
- `appendData(data)` — shallow-merges an object into the flat form; useful when a page component fetches supplementary data via its own `useQuery` and needs to fold it into the wizard form
- `acceptButtons` render prop — rendered on the last page only when `summary` has no errors; consumer provides the final submit button(s)
- `customButtons` render prop — rendered on the last page alongside `acceptButtons` for secondary actions
- `cancelCallback` wired to "Cancel and exit" button in edit mode
- Demo page updated — demonstrates a `calc` field, `hide` prop usage, `acceptButtons`, and full submit flow

**Exit criteria:** All `WizardConfig` props are wired and functional. The engine is feature-complete. Phase 6 builds the showcase module that exercises everything end-to-end.

---

### Phase 6 — Tasks Showcase Module

**Scope:** A self-contained task management wizard under `src/app/wizard-demo/` that exercises the full wizard engine with realistic pages, server-driven mapping, and complete MSW data. This is the canonical reference implementation for future consumers.

**Domain model (flat form):**

```ts
type TaskForm = {
  title:        string
  type:         string          // from dict
  description:  string
  priority:     'low' | 'normal' | 'high'
  deadline:     string          // ISO date
  start_date:   string          // ISO date
  assignee_id:  number          // from dict
  related_ids:  number[]        // linked task IDs
  notes:        string
}
```

**Wizard pages (5 steps):**

| # | Name | Fields | Notes |
|---|---|---|---|
| 1 | `start` | `title`, `type`, `description` | `type` controls conditional field on next page |
| 2 | `schedule` | `priority`, `deadline`, `start_date` | `calc` derives display label for deadline urgency |
| 3 | `assignment` | `assignee_id` | dict lookup; `hide` demo: hide field when `type === 'personal'` |
| 4 | `related` | `related_ids` | multi-select of existing tasks from MSW; `noPayload: false` |
| 5 | `summary` | — | `isSummaryPage: true`; shows `WizardSummary` with fixture errors |

**Route structure:**

```
src/app/wizard-demo/
  page.tsx                    ← task list (table of MSW tasks, links to edit/create)
  new/
    page.tsx                  ← create mode: <Wizard mode="edit" ... />
  [id]/
    page.tsx                  ← edit mode: <Wizard mode="edit" dataUrl="/api/tasks/{id}" ... />
  [id]/view/
    page.tsx                  ← view mode: <Wizard mode="view" ... />
```

**Component structure:**

```
src/components/tasks-wizard/
  pages/
    StartPage.tsx
    SchedulePage.tsx
    AssignmentPage.tsx
    RelatedPage.tsx
    SummaryPage.tsx           ← uses <WizardSummary>
  TasksWizard.tsx             ← assembles WizardConfig, passes to <Wizard>
```

**MSW handlers** (`src/mocks/handlers/tasks-wizard.ts`):

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/tasks/wizard/mapping` | Page + field mapping fixture |
| GET | `/api/tasks/wizard/data` | Empty form for create |
| GET | `/api/tasks/wizard/data/:id` | Pre-filled form for edit |
| PUT | `/api/tasks/wizard/save` | Echo back 200 success |
| GET | `/api/tasks/wizard/validate` | Returns fixture `SummaryResult` with 1 error + 1 warning |
| GET | `/api/tasks/list` | Task list for the index page |
| GET | `/api/tasks/dict/types` | Task type options |
| GET | `/api/tasks/dict/assignees` | Assignee options |

**Fixture mapping** (what `/api/tasks/wizard/mapping` returns):

```ts
[
  {
    name: 'start', label: 'Start',
    fields: [
      { name: 'title',       label: 'Title',       type: 'input',    lp: 1, display: true },
      { name: 'type',        label: 'Task Type',   type: 'select',   lp: 2, display: true },
      { name: 'description', label: 'Description', type: 'textarea', lp: 3, display: true },
    ]
  },
  {
    name: 'schedule', label: 'Schedule',
    fields: [
      { name: 'priority',   label: 'Priority',       type: 'radio', lp: 1, display: true },
      { name: 'deadline',   label: 'Deadline',        type: 'date',  lp: 2, display: true },
      { name: 'start_date', label: 'Start Date',      type: 'date',  lp: 3, display: true },
    ]
  },
  {
    name: 'assignment', label: 'Assignment',
    fields: [
      { name: 'assignee_id', label: 'Assignee', type: 'select', lp: 1, display: true },
    ]
  },
  {
    name: 'related', label: 'Related Tasks',
    fields: [
      { name: 'related_ids', label: 'Related Tasks', type: 'select', lp: 1, display: true },
    ]
  },
  {
    name: 'summary', label: 'Summary',
    fields: []
  },
]
```

**Features exercised by this module:**

| Feature | Where |
|---|---|
| Server-driven labels | All pages — labels from mapping fixture |
| `calc` | `SchedulePage` — derives urgency category from deadline delta |
| `hide` prop | `AssignmentPage` — hides `assignee_id` when `type === 'personal'` |
| `isSummaryPage` | Page 5 — triggers server validation call |
| `WizardSummary` | Summary page — shows fixture error + warning with jump links |
| `saveOnPageChange` | Enabled — auto-saves on every Next in edit mode |
| Save and Quit | Nav button — wires to `cancelCallback` redirect |
| View mode | `/wizard-demo/[id]/view` — all inputs disabled, no save buttons |
| `acceptButtons` | Summary page — submit button enabled when no errors |
| Zod schema | `StartPage` — `title` required, min 3 chars |
| `useWizardField()` | All pages — demonstrates the standard field binding pattern |
| Dict lookup | `AssignmentPage` — `assignee_id` options from `/api/tasks/dict/assignees` |

**Deliverables:**
- `src/mocks/data/tasks-wizard.ts` — all fixture data (mapping, tasks list, form data, dict options, validation result)
- `src/mocks/handlers/tasks-wizard.ts` — all 8 MSW handlers
- `src/mocks/handlers/index.ts` updated — registers tasks-wizard handlers
- `src/components/tasks-wizard/TasksWizard.tsx` — `WizardConfig` assembly
- `src/components/tasks-wizard/pages/StartPage.tsx` — title, type, description; Zod schema
- `src/components/tasks-wizard/pages/SchedulePage.tsx` — priority, dates; `calc` for urgency
- `src/components/tasks-wizard/pages/AssignmentPage.tsx` — assignee dict; conditional hide
- `src/components/tasks-wizard/pages/RelatedPage.tsx` — multi-select related tasks
- `src/components/tasks-wizard/pages/SummaryPage.tsx` — `<WizardSummary>` + `acceptButtons`
- `src/app/wizard-demo/page.tsx` — task list with create + edit links
- `src/app/wizard-demo/new/page.tsx` — create route
- `src/app/wizard-demo/[id]/page.tsx` — edit route
- `src/app/wizard-demo/[id]/view/page.tsx` — view route

**Exit criteria:** A developer can navigate to `/wizard-demo`, see a list of MSW-seeded tasks, click "New task" to open the 5-step wizard, fill in pages, see save toasts on navigation, hit the summary page with a fixture validation error highlighted with a jump link, fix it, and submit. Editing an existing task pre-fills all fields. View mode shows all data read-only.

---

## Key Differences from the Reference Implementation

| Reference (`eMP_web`) | This implementation |
|---|---|
| React Bootstrap | shadcn/ui + Tailwind CSS v4 |
| Redux (`useSelector`, `useDispatch`) | Zustand global store |
| `cloneElement` prop injection | React context + `useWizard()` |
| JSX, no types | TypeScript throughout |
| `useWizardMapping` / `useWizardData` (custom) | TanStack Query hooks |
| `Api` / `Api.put` (custom) | TanStack Query mutation |
| Toast via `react-toastify` | shadcn/ui sonner |
| Dead code (`storeMeta`, `cleanForm` no-ops) | Removed |
| `eslint-disable` suppressions | Real fixes |
| `WizardSummary` operator precedence bug | Fixed in `validation.ts` |
| Inline scroll via `document.getElementById` | Proper `useEffect` + ref |
| No per-page Zod validation | Zod schema per `WizardPage` |
| Wiz input components expose `wiz` prop externally | Self-contained: label + input + validation all internal; `useWizardField()` as escape hatch |
| `stateForPage` per-page data fetching | Dropped — page components use `useQuery` directly if needed |
