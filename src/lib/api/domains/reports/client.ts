import { browserFetch } from '@/lib/api/core/browser-http'
import type {
  CheckStatusResponse,
  GenerateReportInput,
  GenerateReportResponse,
  Permission,
  ReportListParams,
  ReportListPayload,
  TestQueryInput,
  TestQueryResponse,
} from './contract'
import { mapReportList } from './mapper'

export async function fetchReportList(params: ReportListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.search ? { search: params.search } : {}),
  })
  const result = await browserFetch<ReportListPayload>(`/reports?${query}`)
  if (!result.ok) throw new Error(result.error.message)
  return mapReportList(result.data)
}

export async function fetchReportPermissions(): Promise<Permission[]> {
  const result = await browserFetch<Permission[]>('/reports/permissions')
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportResponse> {
  const result = await browserFetch<GenerateReportResponse>('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export async function checkGenerationStatus(jobId: string): Promise<CheckStatusResponse> {
  const result = await browserFetch<CheckStatusResponse>(`/reports/check-status?jobId=${jobId}`)
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export async function downloadReport(jobId: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/reports/download?jobId=${jobId}`,
    { credentials: 'include' },
  )
  if (!response.ok) throw new Error('Błąd pobierania pliku')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^"]+)"?/.exec(disposition)
  a.download = match?.[1] ?? `raport-${jobId}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export async function testQuery(input: TestQueryInput): Promise<TestQueryResponse> {
  const result = await browserFetch<TestQueryResponse>('/reports/test-query', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export async function deleteReportRequest(id: number): Promise<void> {
  const result = await browserFetch<void>(`/reports/${id}`, { method: 'DELETE' })
  if (!result.ok) throw new Error(result.error.message)
}
