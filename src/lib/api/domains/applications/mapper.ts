import type {
  Application,
  ApplicationListPayload,
  ApplicationListResult,
  ApplicationPayload,
} from "@/lib/api/domains/applications/contract";

export function mapApplication(payload: ApplicationPayload): Application {
  return {
    id: payload.id,
    label: payload.label,
    status: payload.status,
    createdAt: new Date(payload.created_at),
    updatedAt: new Date(payload.updated_at),
  };
}

export function mapApplicationList(
  payload: ApplicationListPayload
): ApplicationListResult {
  return {
    items: payload.items.map(mapApplication),
    page: payload.page,
    pageSize: payload.pageSize,
    totalItems: payload.totalItems,
    totalPages: payload.totalPages,
  };
}
