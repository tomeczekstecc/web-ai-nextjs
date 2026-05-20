/**
 * Browser-safe HTTP utility for client-side API fetching.
 *
 * Counterpart to src/lib/api/core/http.ts (server-only).
 * Must not import server-only modules or reference API_URL.
 * Use NEXT_PUBLIC_API_URL for the base URL.
 */

const BROWSER_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type BrowserApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type BrowserApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BrowserApiError };

/**
 * Fetch wrapper for browser-side API calls.
 *
 * - Resolves paths against NEXT_PUBLIC_API_URL.
 * - Returns a discriminated union instead of throwing.
 * - 204 No Content responses resolve to `{ ok: true, data: undefined as T }`.
 * - Accepts any RequestInit options (method, body, headers, etc.).
 */
export async function browserFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<BrowserApiResult<T>> {
  const url = `${BROWSER_API_BASE_URL}${path}`;

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
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: typeof errorData.message === "string"
            ? errorData.message
            : response.statusText,
          details: errorData.details,
        },
      };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    const data = await response.json() as T;
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
