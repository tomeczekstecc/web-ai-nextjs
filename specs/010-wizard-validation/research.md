# Research: Wizard Validation System (Phase 4)

## Current Codebase State

**Phases 1–3 are complete.** The following infrastructure already exists and Phase 4 builds directly on it:

| Already exists | Location |
|---|---|
| `ValidationItem { key, type, msgs }` type | `src/lib/store/types.ts` |
| `SummaryResult` type | `src/lib/wizard/types.ts` |
| `WizardSlice.setWizardValidation(name, items)` | `src/lib/store/wizard.slice.ts` |
| `WizardAPI.validation` and `WizardAPI.setValidation` | `src/components/wizard/WizardProvider.tsx` |
| `WizardAPI.summary: null` (placeholder) | `src/components/wizard/WizardProvider.tsx` |
| `WizardPage.schema?: z.ZodSchema` (declared, unwired) | `src/lib/wizard/types.ts` |
| `WizardConfig.validationUrl?: string` (declared, unwired) | `src/lib/wizard/types.ts` |
| `WizardConfig.acceptButtons` render prop | `src/lib/wizard/types.ts` |
| `ValidationWrapper` scroll anchor `id={pageKey + '.' + field}` | `src/components/wizard/ValidationWrapper.tsx` |
| `createWizardValidationHandler` factory (returns 422) | `src/mocks/handlers/wizard.ts` |

---

## Decision 1 — Zod Error to ValidationItem Mapping

**Decision**: Use `issue.path[0]` as the `key` in `ValidationItem`. Map one issue per path entry (last message wins if duplicated).

**Rationale**: `ValidationItem.key` is a bare field name that Wiz components match directly via `validation.find(item => item.key === keyName)`. Zod issues on a flat form always have `path[0]` equal to the field name. If multiple Zod issues target the same field, all messages are collected into `msgs`.

**Alternatives considered**: Using the full dotted Zod path (for nested objects) — rejected because the wizard form is a flat `Record<string, unknown>`, so nested paths never occur.

---

## Decision 2 — Server Validation Key Format

**Decision**: The server (MSW fixture and future Laravel API) returns bare field names as keys in `SummaryResult.error` and `SummaryResult.warning` (e.g., `"title"`, not `"start.title"`).

**Rationale**: Bare keys match `ValidationItem.key` directly, enabling `useWizardField` to surface inline field errors without any path-splitting. `WizardSummary` resolves which page a field belongs to by looking it up in `mapping.fields`.

**Alternatives considered**: Using dot-notation page-prefixed keys (e.g., `"start.title"`) — rejected as unnecessarily complex when the mapping already encodes page-field relationships.

---

## Decision 3 — parseSummaryResult Signature

**Decision**: `parseSummaryResult(result: SummaryResult): ValidationItem[]`

Takes only the `SummaryResult`. Returns a flat array of `ValidationItem` with bare field name keys. De-duplicates warnings by suppressing any warning whose key already has an error.

**Rationale**: Page grouping is WizardSummary's responsibility (it has access to `mapping` from context). `parseSummaryResult` is a pure converter with no UI dependencies. `dicts_msg` entries are excluded from the returned array — they are rendered separately by `WizardSummary` reading `summary` directly.

**Alternatives considered**: Passing `mapping` into `parseSummaryResult` for pre-grouped output — rejected; adds coupling between a pure utility and the UI data shape.

---

## Decision 4 — summary State Location

**Decision**: `summary: SummaryResult | null` is local state inside `WizardProvider` (React `useState`), not in the Zustand store.

**Rationale**: The summary result is transient and wizard-instance-specific. It is fetched on summary page entry and cleared on wizard unmount. It does not need cross-component sharing beyond the wizard tree, which already has access via `WizardContext`.

**Alternatives considered**: Storing `summary` in Zustand alongside `validation` — rejected; the summary is UI-state (display-only) and does not need to survive re-renders the way form data does.

---

## Decision 5 — Navigation Clearing Behavior

**Decision**: The `nav(toPage)` function (used by Back/Next buttons) clears validation before running the Zod schema and writing new errors. The `setPageByName(name, scrollTo)` function (used for summary jump links) does NOT clear validation.

**Rationale**: When the user jumps from summary to a data page via a jump link, the inline field errors must remain visible so they can correct the highlighted field. When using Back/Next, the schema for the current page is re-evaluated fresh, so any stale errors from the previous attempt are irrelevant.

**Alternatives considered**: Always clearing validation on any page change — rejected because jump-from-summary would silently erase the inline errors the user needs to see.

---

## Decision 6 — WizardSummary Grouping Logic

**Decision**: `WizardSummary` groups `ValidationItem[]` by page by iterating `mapping` and collecting items whose `key` matches any `field.name` in that page's `fields` array. Items with no mapping match render under a fallback "Inne" (Other) group.

**Rationale**: The mapping is always available in context and is the authoritative source of which fields belong to which page. This avoids encoding page information in ValidationItem keys.

---

## Decision 7 — acceptButtons Condition

**Decision**: `acceptButtons` is rendered by `WizardSummary` when `summary` has no errors (i.e., `Object.keys(summary?.error ?? {}).length === 0`). The condition checks the raw `SummaryResult`, not the `ValidationItem[]`, to ensure dict-level errors also block acceptance.

**Rationale**: `dicts_msg` errors would not appear in the flat `ValidationItem[]` returned by `parseSummaryResult`, so checking the raw `SummaryResult` is the only way to correctly block `acceptButtons` when entity-level errors are present.
