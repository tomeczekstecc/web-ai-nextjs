import { browserFetch } from '@/lib/api/core/browser-http'
import { parseContentDispositionFilename } from '@/lib/api/core/download-blob'
import type {
  CheckStatusResponse,
  Permission,
  ReportListParams,
  ReportListPayload,
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

export async function checkGenerationStatus(jobId: string): Promise<CheckStatusResponse> {
  const result = await browserFetch<CheckStatusResponse>(`/reports/check-status?jobId=${jobId}`)
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export async function downloadReport(
  jobId: string,
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/reports/download?jobId=${jobId}`,
    { credentials: 'include' },
  )
  if (!response.ok) throw new Error('Błąd pobierania pliku')
  const blob = await response.blob()
  const filename =
    parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
    `raport-${jobId}.xlsx`
  return { blob, filename }
}


