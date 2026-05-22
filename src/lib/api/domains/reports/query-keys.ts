import type { ReportListParams } from './contract'

export const reportsKeys = {
  all: ['reports'] as const,
  list: (params?: ReportListParams) => [...reportsKeys.all, 'list', params] as const,
  permissions: () => [...reportsKeys.all, 'permissions'] as const,
}
