import {
  deleteReportRequest,
  generateReport,
  testQuery as testQueryClient,
} from './client'
import type { GenerateReportInput, TestQueryInput } from './contract'

export async function deleteReport(id: number): Promise<void> {
  await deleteReportRequest(id)
}

export async function submitGenerateReport(input: GenerateReportInput) {
  return generateReport(input)
}

export async function submitTestQuery(input: TestQueryInput) {
  return testQueryClient(input)
}
