# Data Model: Wizard System Phase 1

**Date**: 2026-05-10

---

## Zustand Store Layer

### `ValidationItem`
Represents a single field-level error or warning. Defined in `src/lib/store/types.ts` because it is part of store state (consumed by the slice).

```
ValidationItem
  key:   string     — field name (e.g. "title")
  type:  "error" | "warning"
  msgs:  string[]   — one or more human-readable messages
```

### `WizardEntry`
The per-wizard-instance state held in the store, keyed by wizard `name`.

```
WizardEntry
  form:  Record<string, unknown>   — flat form data
  meta:
    validation: ValidationItem[]   — current inline validation state
```

### `WizardSlice`
The wizard sub-state of the global store. Exposes three mutating actions.

```
WizardSlice
  wizards:             Record<string, WizardEntry>
  setWizardData(name, data)        — upsert form data; preserve existing meta
  setWizardValidation(name, items) — replace validation items
  clearWizard(name)                — remove entry entirely (on unmount)
```

### `StoreState`
Union of all slices. In Phase 1 it equals `WizardSlice`; future slices are merged here.

```
StoreState = WizardSlice
```

---

## Wizard Engine Layer

Defined in `src/lib/wizard/types.ts`.

### `FieldMeta`
Server-side field descriptor returned by the mapping endpoint. Not used in Phase 1 (mapping is Phase 2) but defined here so types compile across phases.

```
FieldMeta
  name:     string
  label:    string
  type:     "input" | "select" | "textarea" | "date" | "radio" | "checkbox"
  lp:       number    — sort order
  display:  boolean
  max?:     number
  decimal?: number
```

### `PageMapping`
One page descriptor from the mapping endpoint.

```
PageMapping
  name:   string
  label:  string
  fields: FieldMeta[]
```

### `SummaryResult`
Server 422 response shape for the summary/validation page.

```
SummaryResult
  error:     Record<string, string[]>   — fieldPath → messages
  warning:   Record<string, string[]>
  dicts_msg?:
    error:   Record<string, string[]>
    warning: Record<string, string[]>
```

### `WizardPage<T>`
Consumer-provided page configuration.

```
WizardPage<T = Record<string, unknown>>
  name:           string           — matches server mapping page name
  form:           ReactElement     — page component (no wiz props)
  disabled?:      boolean          — non-navigable in side nav
  isSummaryPage?: boolean          — triggers validationUrl call on enter
  noPayload?:     boolean          — skip PUT on save for this page
  calc?:          (form: T) => T   — derived field calculator (runs on every setValue)
  schema?:        ZodSchema        — per-page Zod validation (Phase 4)
```

### `WizardConfig<T>`
Top-level `<Wizard>` props.

```
WizardConfig<T = Record<string, unknown>>
  name:                  string
  mode:                  "view" | "edit"
  pages:                 WizardPage<T>[]
  mappingUrl:            string
  dataUrl:               string
  saveUrl?:              string
  validationUrl?:        string
  saveOnPageChange:      boolean
  addData?:              Record<string, unknown>
  acceptButtons?:        (summary: SummaryResult | null) => ReactNode
  customButtons?:        () => ReactNode
  saveAndQuitCallback?:  () => void
  cancelCallback?:       () => void
```

### `WizardAPI<T>`
The context value provided by `WizardProvider` and consumed via `useWizard()`.

```
WizardAPI<T = Record<string, unknown>>
  — Form state
  form:          T
  setValue(key, value)
  setForm(form)
  appendData(data)
  clearFields(fields)

  — Mapping helpers (populated in Phase 2; return fallbacks in Phase 1)
  mapping:       PageMapping[]
  getLabel(field, page?) → string
  getType(field, page?)  → FieldType
  getDisplay(field, page?) → boolean
  getMax(field, page?)   → number | undefined
  getDecimal(field, page?) → number

  — Navigation
  page:          number
  pageKey:       string
  setPageByName(name, scrollTo?)
  nav(toPage)    → Promise<void>

  — Validation
  validation:    ValidationItem[]
  setValidation(items)
  summary:       SummaryResult | null

  — Save (wired in Phase 2)
  save()         → Promise<void>
  saveAndQuit()  → Promise<void>

  — State flags
  mode:          "view" | "edit"
  loading:       boolean
  busy:          boolean
  refetch()
```

---

## State Transitions

```
Wizard mounts
  → clearWizard(name)          store: wizards[name] = undefined

User navigates to page N
  → nav(N) called
  → setWizardValidation(name, [])
  → page = N

User calls setValue(key, value)
  → calc(form) runs if WizardPage.calc defined
  → setWizardData(name, updatedForm)

Wizard unmounts
  → clearWizard(name)          store: wizards[name] = undefined
```
