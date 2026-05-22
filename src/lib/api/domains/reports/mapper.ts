import type {
  QueryParameter,
  QueryParameterPayload,
  ReportListItem,
  ReportListItemPayload,
  ReportListPayload,
  ReportListResult,
} from './contract'

export function mapQueryParameter(p: QueryParameterPayload): QueryParameter {
  return {
    name: p.name,
    type: p.type,
    defaultValue: p.default_value,
    description: p.description,
  }
}

export function mapReportListItem(p: ReportListItemPayload): ReportListItem {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    parameters: p.parameters.map(mapQueryParameter),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

export function mapReportList(payload: ReportListPayload): ReportListResult {
  return {
    items: payload.items.map(mapReportListItem),
    page: payload.page,
    pageSize: payload.pageSize,
    totalItems: payload.totalItems,
    totalPages: payload.totalPages,
  }
}
