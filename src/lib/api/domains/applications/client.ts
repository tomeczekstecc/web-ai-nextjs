import type {
  Application,
  ApplicationListParams,
  ApplicationListResult,
  ApiErrorResponse,
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateApplicationStatusInput,
} from "@/lib/api/domains/applications/contract";
import {
  mapApplication,
  mapApplicationList,
} from "@/lib/api/domains/applications/mapper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorResponse };

async function browserFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<FetchResult<T>> {
  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.message || response.statusText,
          details: errorData.details,
        },
      };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Blad sieci",
      },
    };
  }
}

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
  const result = await browserFetch<{
    items: Array<{
      id: string;
      label: string;
      status: "draft" | "submitted" | "archived";
      created_at: string;
      updated_at: string;
    }>;
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }>(`/applications?${query}`);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplicationList(result.data);
}

export async function fetchApplication(id: string): Promise<Application> {
  const result = await browserFetch<{
    id: string;
    label: string;
    status: "draft" | "submitted" | "archived";
    created_at: string;
    updated_at: string;
  }>(`/applications/${id}`);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplication(result.data);
}

export async function createApplication(
  input: CreateApplicationInput
): Promise<Application> {
  const result = await browserFetch<{
    id: string;
    label: string;
    status: "draft" | "submitted" | "archived";
    created_at: string;
    updated_at: string;
  }>("/applications", {
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
  const result = await browserFetch<{
    id: string;
    label: string;
    status: "draft" | "submitted" | "archived";
    created_at: string;
    updated_at: string;
  }>(`/applications/${input.id}`, {
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
  const result = await browserFetch<{
    id: string;
    label: string;
    status: "draft" | "submitted" | "archived";
    created_at: string;
    updated_at: string;
  }>(`/applications/${input.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: input.status }),
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapApplication(result.data);
}
