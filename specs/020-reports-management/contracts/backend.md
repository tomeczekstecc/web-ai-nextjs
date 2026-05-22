# Backend Contracts: Reports Management Module

**Feature**: 020-reports-management
**Date**: 2026-05-22
**Base URL**: `NEXT_PUBLIC_API_URL` (e.g. `https://api.example.com`)
**Auth**: Session cookie (`credentials: 'include'` via `browserFetch`)

---

## CRUD Endpoints (via wizard API routes)

### GET /api/reports/wizard/mapping
Returns field metadata (labels, types, validation rules) for the reports wizard.

**Response**
```ts
PageMapping[]  // see src/lib/wizard/types.ts
```

---

### GET /api/reports/wizard/data
Returns empty/default form data for report creation.

**Response**
```ts
{
  status: 'projekt',
  name: '',
  description: '',
  is_kop: false,
  sql_query: '',
  parameters: [],
  permission_ids: []
}
```

---

### GET /api/reports/wizard/data/[id]
Returns existing report data pre-populated for editing.

**Response**
```ts
{
  id: number
  status: 'projekt' | 'aktywny' | 'archiwum'
  name: string
  description: string
  is_kop: boolean
  sql_query: string
  parameters: {
    name: string
    type: 'numer' | 'string' | 'boolean' | 'data'
    default_value: string
    description: string
  }[]
  permission_ids: number[]
}
```

---

### POST /api/reports/wizard/save
Creates or updates a report. `id` presence in body determines create vs update.

**Request body**
```ts
{
  id?: number                    // omit for create
  status: ReportStatus
  name: string
  description: string
  is_kop: boolean
  sql_query: string
  parameters: {
    name: string
    type: ParameterType
    default_value: string
    description: string
  }[]
  permission_ids: number[]
}
```

**Response**
```ts
{ id: number }
```

---

## Reports List Endpoint

### GET /reports
Returns paginated, searchable list of reports.

**Query params**
```
page: number
pageSize: number
search?: string
```

**Response**
```ts
{
  items: {
    id: number
    name: string
    status: 'projekt' | 'aktywny' | 'archiwum'
    parameters: { name: string; type: string }[]   // lightweight, for drawer param count check
    created_at: string
    updated_at: string
  }[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
```

---

## Delete Endpoint

### DELETE /reports/[id]
Permanently removes a report.

**Response**: `204 No Content`

---

## Permissions Endpoint

### GET /reports/permissions
Returns all assignable permissions.

**Response**
```ts
{ id: number; label: string }[]
```

---

## Test Query Endpoint

### POST /reports/test-query
Tests a SQL query against the database with LIMIT 1.

**Request body**
```ts
{
  sql: string
  parameters?: { name: string; value: string | number | boolean }[]
}
```

**Response (success)**
```ts
{
  columns: string[]
  rows: Record<string, unknown>[]   // 0 or 1 rows
}
```

**Response (error)**
```ts
{
  message: string   // SQL syntax or runtime error description
}
```

---

## Generation Endpoints

### POST /reports/generate
Triggers async report generation.

**Request body**
```ts
{
  reportId: number
  parameters?: { name: string; value: string | number | boolean }[]
}
```

**Response**
```ts
{ jobId: string }
```

---

### GET /reports/check-status?jobId={jobId}
Polls generation job status.

**Response**
```ts
{
  jobId: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  message?: string   // error description when status === 'failed'
}
```

---

### GET /reports/download?jobId={jobId}
Downloads the generated report file.

**Response**: Binary file stream (`Content-Disposition: attachment`).
Frontend triggers download via `Blob` URL.

---

## TypeScript Contract Types (`src/lib/api/domains/reports/contract.ts`)

```ts
export type ReportStatus = 'projekt' | 'aktywny' | 'archiwum'
export type ParameterType = 'numer' | 'string' | 'boolean' | 'data'
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'
export type GenerationState = 'idle' | 'pending' | 'done' | 'failed'

export type QueryParameterPayload = {
  name: string
  type: ParameterType
  default_value: string
  description: string
}

export type QueryParameter = {
  name: string
  type: ParameterType
  defaultValue: string
  description: string
}

export type ReportListItemPayload = {
  id: number
  name: string
  status: ReportStatus
  parameters: QueryParameterPayload[]
  created_at: string
  updated_at: string
}

export type ReportListItem = {
  id: number
  name: string
  status: ReportStatus
  parameters: QueryParameter[]
  createdAt: string
  updatedAt: string
}

export type ReportListPayload = {
  items: ReportListItemPayload[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type ReportListResult = {
  items: ReportListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type Permission = {
  id: number
  label: string
}

export type GenerateReportInput = {
  reportId: number
  parameters?: { name: string; value: string | number | boolean }[]
}

export type GenerateReportResponse = {
  jobId: string
}

export type CheckStatusResponse = {
  jobId: string
  status: JobStatus
  message?: string
}

export type TestQueryInput = {
  sql: string
  parameters?: { name: string; value: string | number | boolean }[]
}

export type TestQueryResponse = {
  columns: string[]
  rows: Record<string, unknown>[]
}
```
