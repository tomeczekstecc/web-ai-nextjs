import type { MenuConfig } from "@/lib/api/domains/menu/contract";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function browserFetch<T>(path: string): Promise<FetchResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: (errorData as { message?: string }).message ?? response.statusText,
        },
      };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Błąd sieci",
      },
    };
  }
}

export async function fetchMenuConfig(): Promise<MenuConfig> {
  const result = await browserFetch<MenuConfig>("/config/menu");
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
