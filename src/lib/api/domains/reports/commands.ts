import { browserFetch } from '@/lib/api/core/browser-http'
import type { GenerateReportInput, GenerateReportResponse, TestQueryInput, TestQueryResponse } from './contract'

export async function deleteReport(id: number): Promise<void> {
  const result = await browserFetch<void>(`/reports/${id}`, { method: 'DELETE' })
  if (!result.ok) throw new Error(result.error.message)
}

export async function submitGenerateReport(input: GenerateReportInput): Promise<GenerateReportResponse> {
  const result = await browserFetch<GenerateReportResponse>('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export async function submitTestQuery(input: TestQueryInput): Promise<TestQueryResponse> {
  const result = await browserFetch<TestQueryResponse>('/reports/test-query', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}
