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

export type ReportListParams = {
  page: number
  pageSize: number
  search?: string
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
