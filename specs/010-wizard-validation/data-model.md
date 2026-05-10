# Data Model: Wizard Validation System (Phase 4)

## Existing Types (unchanged)

These types already exist from Phases 1–3 and are used as-is by Phase 4:

```ts
// src/lib/store/types.ts
type ValidationItem = {
  key:   string            // bare field name, e.g. 'title'
  type:  'error' | 'warning'
  msgs:  string[]          // one or more messages for this field
}

// src/lib/wizard/types.ts
type SummaryResult = {
  error:    Record<string, string[]>
  warning:  Record<string, string[]>
  dicts_msg?: {
    error:   Record<string, string[]>
    warning: Record<string, string[]>
  }
}
```

## Validation Flow

```
User clicks Next/Back
  │
  ▼
nav(toPage) in WizardProvider
  │
  ├─ page.schema? → runPageSchema(schema, form) → ValidationItem[]
  │       │
  │       ├─ items.length > 0 → setValidation(items) → BLOCK navigation
  │       └─ items.length = 0 → setValidation([]) → PROCEED
  │
  └─ proceed to toPage
        │
        └─ isSummaryPage? → GET validationUrl → SummaryResult (422)
                │
                ├─ setSummary(result)
                └─ setValidation(parseSummaryResult(result))
```

## Zod Runner — runPageSchema

```ts
// src/lib/wizard/validation.ts

function runPageSchema<T>(schema: z.ZodSchema<T>, form: T): ValidationItem[]
```

**Input**: a Zod schema and the flat wizard form object.

**Output**: `ValidationItem[]` with one entry per unique failing field.

**Mapping rule**: `issue.path[0]` → `key`; all issues with the same path[0] are merged into one `msgs` array.

## parseSummaryResult

```ts
// src/lib/wizard/validation.ts

function parseSummaryResult(result: SummaryResult): ValidationItem[]
```

**Input**: raw SummaryResult from a 422 response.

**Output**: flat `ValidationItem[]`. Warnings whose `key` already has an error entry are suppressed (de-duplicated). `dicts_msg` entries are excluded — WizardSummary renders them separately from the raw `summary` object.

## WizardProvider State Extension

| Addition | Type | Location |
|---|---|---|
| `summary` | `SummaryResult \| null` | React `useState` inside `WizardProvider` |

`summary` is passed into `WizardContext` and exposed via `useWizard()`. It is set when entering a summary page, and reset to `null` on wizard unmount.

## WizardSummary Display Model

WizardSummary derives its display model from three context values:

| Source | Used for |
|---|---|
| `validation: ValidationItem[]` | per-field grouping and inline error/warning labels |
| `summary: SummaryResult \| null` | overall status (any errors?), dicts_msg section, acceptButtons gate |
| `mapping: PageMapping[]` | grouping ValidationItems by page, resolving field labels |

**Grouping logic** (conceptual):

```
for each page in mapping:
  pageErrors   = validation.filter(v => page.fields.some(f => f.name === v.key && v.type === 'error'))
  pageWarnings = validation.filter(v => page.fields.some(f => f.name === v.key && v.type === 'warning'))
  if pageErrors or pageWarnings → render page group
```

**Overall status**:

```
errors present   → 'error'   (red Alert)
warnings only    → 'warning' (yellow Alert)
neither          → 'success' (green Alert)
```

**acceptButtons gate**:

```
show only when:
  Object.keys(summary?.error ?? {}).length === 0
  AND Object.keys(summary?.dicts_msg?.error ?? {}).length === 0
```
