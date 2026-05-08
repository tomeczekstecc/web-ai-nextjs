import type { ApplicationListParams } from "@/lib/api/domains/applications/contract";

function normalizeParams(params: ApplicationListParams) {
  return {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search?.trim() || undefined,
    status: params.status || undefined,
    sort: params.sort || undefined,
  };
}

export const applicationsKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationsKeys.all, "list"] as const,
  list: (params: ApplicationListParams) =>
    [...applicationsKeys.lists(), normalizeParams(params)] as const,
  details: () => [...applicationsKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationsKeys.details(), id] as const,
};
