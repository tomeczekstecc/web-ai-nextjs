import type {
  Application,
  ApplicationListParams,
  ApplicationListResult,
  ApplicationListPayload,
  ApplicationPayload,
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateApplicationStatusInput,
} from "@/lib/api/domains/applications/contract";
import {
  mapApplication,
  mapApplicationList,
} from "@/lib/api/domains/applications/mapper";
import { browserFetch } from "@/lib/api/core/browser-http";

function buildListQueryParams(params: ApplicationListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  return searchParams.toString();
}

export async function fetchApplicationList(
  params: ApplicationListParams
): Promise<ApplicationListResult> {
  const query = buildListQueryParams(params);
  const result = await browserFetch<ApplicationListPayload>(`/applications?${query}`);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplicationList(result.data);
}

export async function fetchApplication(id: string): Promise<Application> {
  const result = await browserFetch<ApplicationPayload>(`/applications/${id}`);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplication(result.data);
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const result = await browserFetch<ApplicationPayload>("/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplication(result.data);
}

export async function updateApplication(
  input: UpdateApplicationInput
): Promise<Application> {
  const result = await browserFetch<ApplicationPayload>(`/applications/${input.id}`, {
    method: "PATCH",
    body: JSON.stringify({ label: input.label }),
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplication(result.data);
}

export async function deleteApplication(id: string): Promise<void> {
  const result = await browserFetch<void>(`/applications/${id}`, {
    method: "DELETE",
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }
}

export async function updateApplicationStatus(
  input: UpdateApplicationStatusInput
): Promise<Application> {
  const result = await browserFetch<ApplicationPayload>(`/applications/${input.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: input.status }),
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplication(result.data);
}
