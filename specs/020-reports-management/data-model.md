# Data Model: Reports Management Module

**Feature**: 020-reports-management
**Date**: 2026-05-22

---

## Entities

### Report

Represents a configured data report. Stored and managed via backend CRUD.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Backend-assigned |
| `name` | `string` | "Nazwa" — display name |
| `status` | `ReportStatus` | `'projekt' \| 'aktywny' \| 'archiwum'` |
| `description` | `string` | "Opis1" — max 2 000 chars |
| `isKop` | `boolean` | KOP module flag |
| `sqlQuery` | `string` | Raw SQL (may contain `{{paramName}}` placeholders) |
| `parameters` | `QueryParameter[]` | Ordered list of named parameters |
| `permissionIds` | `number[]` | Assigned permission IDs |
| `createdAt` | `string` | ISO 8601 (from backend payload) |
| `updatedAt` | `string` | ISO 8601 (from backend payload) |

**Backend payload type** (`ReportPayload`): snake_case fields (`is_kop`, `sql_query`, `permission_ids`, `created_at`, `updated_at`).
**Frontend mapped type** (`Report`): camelCase fields as above.

---

### ReportStatus

```ts
type ReportStatus = 'projekt' | 'aktywny' | 'archiwum'
```

| Value | Polish label | Badge variant |
|-------|-------------|---------------|
| `projekt` | Projekt | `outline` |
| `aktywny` | Aktywny | `default` |
| `archiwum` | Archiwum | `secondary` |

---

### QueryParameter

A named parameter defined at report-authoring time (wizard step 2).

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | SQL placeholder name |
| `type` | `ParameterType` | `'numer' \| 'string' \| 'boolean' \| 'data'` |
| `defaultValue` | `string` | Shown as "Wartość parametru"; pre-fills generation drawer |
| `description` | `string` | "Opis parametru"; shown as helper text in generation drawer |

**Parameter type → input control mapping**:

| Type | Input control |
|------|--------------|
| `numer` | `<input type="number">` |
| `string` | `<input type="text">` |
| `boolean` | `<Checkbox>` / toggle |
| `data` | Date picker (ISO 8601 output) |

---

### RuntimeParameterValue

The concrete value entered in the generation drawer for a specific `QueryParameter`.

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Matches `QueryParameter.name` |
| `value` | `string \| number \| boolean` | Typed per parameter type |

Sent as `parameters[]` in the `/generate` request body.

---

### Permission

A system-level access right assignable to a report.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Backend ID |
| `label` | `string` | Display name |

---

### GenerationJob

Represents an async backend generation task.

| Field | Type | Notes |
|-------|------|-------|
| `jobId` | `string` | Returned by `POST /reports/generate` |
| `status` | `JobStatus` | `'pending' \| 'processing' \| 'done' \| 'failed'` |
| `message` | `string \| undefined` | Error message when `failed` |

---

## Wizard Form State

The wizard Zustand store holds a flat record for the reports wizard. Key shape:

```ts
type ReportsWizardForm = {
  // Step 1 — Dane podstawowe
  status: ReportStatus
  name: string
  description: string
  isKop: boolean

  // Step 2 — Zapytanie
  sqlQuery: string
  parameters: QueryParameter[]

  // Step 3 — Uprawnienia
  permissionIds: number[]
}
```

---

## Zustand Store — Reports Slice

```ts
type GenerationState = 'idle' | 'pending' | 'done' | 'failed'

type ReportsSlice = {
  generationStates: Record<number, GenerationState>
  setGenerationState: (reportId: number, state: GenerationState) => void
  clearGenerationState: (reportId: number) => void
}
```

Derived selector used in table: `anyPending = Object.values(generationStates).some(s => s === 'pending')`.

---

## State Transitions — Report Lifecycle

```
projekt ──► aktywny ──► archiwum
   ▲            │
   └────────────┘  (can revert via edit)
```

Status is user-controlled via the "Status" select in step 1. No automatic transitions.

---

## State Transitions — Generation Job

```
[user clicks Generate]
        │
        ▼
   POST /generate ──► { jobId }
        │
        ▼
   poll /check-status (every 3s, max 20 attempts)
        │
   ┌────┴────┐
pending  processing
        │
   ┌────┴────┐
  done     failed
   │           │
download    error toast
 trigger   + re-enable button
```
