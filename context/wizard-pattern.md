# Wizard Pattern

A backend-driven, multi-page form framework for complex data entry flows.

## Overview

The Wizard system manages multi-step forms where:
- Field metadata (labels, types, constraints) comes from the backend
- Form state is shared across pages via Zustand + React Context
- Each page can define a Zod schema for local validation before navigation
- A summary page triggers server-side validation before final submission

## Architecture

```
<Wizard>                     ← public API — composes Provider + Shell
  <WizardProvider>           ← state, data fetching, navigation logic
    <WizardContext.Provider> ← WizardAPI available to all descendant pages
      <WizardShell>          ← sidebar nav + page renderer + nav buttons
        pages[page].form     ← active page (uses useWizard() internally)
```

### File Map

```
src/
├── components/wizard/
│   ├── Wizard.tsx           ← entry point — renders WizardProvider + WizardShell
│   ├── WizardProvider.tsx   ← state orchestrator (form, nav, validation, save)
│   ├── WizardContext.ts     ← React Context holding WizardAPI
│   ├── WizardSummary.tsx    ← summary page component (errors/warnings display)
│   └── inputs/              ← field components (InputWiz, SelectWiz, etc.)
│
├── hooks/wizard/
│   ├── useWizard.ts         ← consumer hook — throws if outside WizardProvider
│   ├── useWizardMapping.ts  ← TanStack Query: GET mappingUrl (staleTime: Infinity)
│   ├── useWizardData.ts     ← TanStack Query: GET dataUrl (staleTime: Infinity)
│   ├── useWizardField.ts    ← convenience hook per field
│   └── useWizardSave.ts     ← TanStack Query mutation: PUT saveUrl
│
└── lib/wizard/
    ├── types.ts             ← WizardConfig, WizardPage, WizardAPI, FieldMeta, etc.
    └── validation.ts        ← runPageSchema (Zod), parseSummaryResult (server errors)
```

## Usage

### 1. Define Pages

Each page is a React element. Page components call `useWizard()` to read and write form data.

```tsx
// src/components/my-wizard/pages/BasicInfoPage.tsx
"use client"
import { z } from "zod"
import { useWizard } from "@/hooks/wizard/useWizard"
import { InputWiz } from "@/components/wizard/inputs/InputWiz"

export const basicInfoSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki."),
  description: z.string().optional(),
})

export function BasicInfoPage() {
  // useWizard() must be inside <WizardProvider>
  const { form, setValue } = useWizard<{ title: string; description?: string }>()

  return (
    <div className="flex flex-col gap-4">
      <InputWiz field="title" />
      <InputWiz field="description" />
    </div>
  )
}
```

### 2. Assemble the Wizard

```tsx
// src/components/my-wizard/MyWizard.tsx
"use client"
import { Wizard } from "@/components/wizard/Wizard"
import { WizardSummary } from "@/components/wizard/WizardSummary"
import type { WizardPage } from "@/lib/wizard/types"
import { BasicInfoPage, basicInfoSchema } from "./pages/BasicInfoPage"
import { ReviewPage } from "./pages/ReviewPage"

type MyForm = Record<string, unknown>

const pages: WizardPage<MyForm>[] = [
  { name: "basic",   form: <BasicInfoPage />, schema: basicInfoSchema },
  { name: "review",  form: <ReviewPage /> },
  { name: "summary", form: <WizardSummary />, isSummaryPage: true },
]

export function MyWizard({ id, mode }: { id?: number; mode: "edit" | "view" }) {
  return (
    <Wizard
      name="my-wizard"                          // unique identifier
      mode={mode}
      pages={pages}
      mappingUrl="/api/my-wizard/mapping"        // GET → PageMapping[]
      dataUrl={id ? `/api/my-wizard/data/${id}` : "/api/my-wizard/data"}
      saveUrl="/api/my-wizard/save"              // PUT payload
      validationUrl="/api/my-wizard/validate"    // GET → SummaryResult (summary page only)
      saveOnPageChange={true}
      cancelCallback={() => router.push("/list")}
      saveAndQuitCallback={() => router.push("/list")}
      acceptButtons={(summary) => (
        <Button disabled={hasErrors(summary)}>Wyślij</Button>
      )}
    />
  )
}
```

### 3. Use in a Route

```tsx
// src/app/my-feature/new/page.tsx
"use client"
import { MyWizard } from "@/components/my-wizard/MyWizard"

export default function NewPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nowy wpis</h1>
      <MyWizard mode="edit" />
    </div>
  )
}
```

## WizardConfig Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Unique identifier — scopes Zustand state |
| `mode` | `"edit" \| "view"` | ✅ | `"view"` disables all inputs |
| `pages` | `WizardPage[]` | ✅ | Ordered page definitions |
| `mappingUrl` | `string` | ✅ | Backend URL returning `PageMapping[]` |
| `dataUrl` | `string` | ✅ | Backend URL returning form data |
| `saveUrl` | `string` | — | PUT endpoint; if omitted, saves are no-ops |
| `validationUrl` | `string` | — | GET endpoint on summary page → `SummaryResult` |
| `saveOnPageChange` | `boolean` | ✅ | Auto-save when navigating in `"edit"` mode |
| `cancelCallback` | `() => void` | — | Called when "Anuluj" is clicked |
| `saveAndQuitCallback` | `() => void` | — | Called after save + quit |
| `acceptButtons` | `(summary) => ReactNode` | — | Final submit button(s) on last page |
| `customButtons` | `() => ReactNode` | — | Extra buttons on last page |

## WizardPage Options

| Option | Type | Description |
|---|---|---|
| `name` | `string` | Matches `PageMapping.name` from backend |
| `form` | `ReactElement` | The page component to render |
| `schema` | `z.ZodSchema` | Validated before navigation to next page |
| `calc` | `(form: T) => T` | Derives computed fields after any field change |
| `isSummaryPage` | `boolean` | Triggers `validationUrl` fetch on arrival |
| `disabled` | `boolean` | Disables sidebar nav button |
| `noPayload` | `boolean` | Excludes page fields from save payload |

## WizardAPI (via useWizard)

```tsx
const {
  // Form state
  form,          // current form data (typed T)
  setValue,      // set a single field
  setForm,       // replace full form
  appendData,    // merge partial data
  clearFields,   // remove specific keys

  // Field metadata from mapping
  mapping,       // PageMapping[]
  getLabel,      // (field, page?) => string
  getType,       // (field, page?) => FieldType
  getDisplay,    // (field, page?) => boolean
  getMax,        // (field, page?) => number | undefined
  getDecimal,    // (field, page?) => number

  // Navigation
  page,          // current page index
  pageKey,       // current page name
  nav,           // (toPage: number) => Promise<void> — validates + saves
  setPageByName, // (name, scrollTo?) — jump by page name

  // Persistence
  save,          // () => Promise<void>
  saveAndQuit,   // () => Promise<void>
  refetch,       // re-fetch dataUrl

  // Validation
  validation,    // ValidationItem[] from page schema + server
  setValidation, // override validation items
  summary,       // SummaryResult | null (set on summary page)

  // State
  mode,          // "edit" | "view"
  loading,       // mapping or data loading
  busy,          // save in progress
} = useWizard<MyForm>()
```

## Validation Flow

```
User clicks "Dalej" (Next)
  → nav(nextPage) called
  → if pages[current].schema: runPageSchema(schema, form)
      → if errors: setWizardValidation() + abort navigation
  → if saveOnPageChange && mode === "edit": useWizardSave.mutateAsync()
  → setPage(nextPage)
  → if isSummaryPage && validationUrl:
      → GET validationUrl → SummaryResult
      → parseSummaryResult() → ValidationItem[]
```

## Backend Contract

### Mapping endpoint — `GET mappingUrl`

```json
[
  {
    "name": "basic",
    "label": "Dane podstawowe",
    "fields": [
      { "name": "title", "label": "Tytuł", "type": "input", "lp": 1, "display": true },
      { "name": "amount", "label": "Kwota", "type": "input", "lp": 2, "display": true, "max": 1000000, "decimal": 2 }
    ]
  }
]
```

### Data endpoint — `GET dataUrl`

```json
{ "title": "", "amount": null }
```

### Save endpoint — `PUT saveUrl`

Request body: full form object. Returns 200 on success.

### Validation endpoint — `GET validationUrl`

```json
{
  "error": { "title": ["Tytuł jest wymagany."] },
  "warning": { "amount": ["Kwota wydaje się niska."] },
  "dicts_msg": {
    "error": { "formularz": ["Formularz zawiera błędy krytyczne."] },
    "warning": {}
  }
}
```

## Key Rules

- **`name` must be unique** per mounted wizard — it scopes the Zustand slice.
- **Never call `useWizard()` outside `<WizardProvider>`** — it throws.
- **Page components are always server-unaware** — they only read/write via `useWizard()`.
- **`schema` validates only the current page's fields** — not the entire form.
- **`calc` runs on every `setValue`** — use for derived/computed fields only.
- **`isSummaryPage: true`** triggers the `validationUrl` fetch — use on the last page only.
- **The Zustand store is cleared on mount and unmount** — no stale state between visits.
