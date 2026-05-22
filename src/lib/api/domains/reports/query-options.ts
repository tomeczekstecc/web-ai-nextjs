import { queryOptions } from '@tanstack/react-query'
import { fetchReportList, fetchReportPermissions } from './client'
import { reportsKeys } from './query-keys'
import type { ReportListParams } from './contract'

export function reportListOptions(params: ReportListParams) {
  return queryOptions({
    queryKey: reportsKeys.list(params),
    queryFn: () => fetchReportList(params),
    staleTime: 30_000,
  })
}

export function reportPermissionsOptions() {
  return queryOptions({
    queryKey: reportsKeys.permissions(),
    queryFn: fetchReportPermissions,
    staleTime: 5 * 60_000,
  })
}
