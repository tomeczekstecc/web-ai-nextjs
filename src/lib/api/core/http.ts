import "server-only";

import { buildApiUrl } from "@/lib/api/core/config";
import type { ApiRequestOptions, ApiResult } from "@/lib/api/contracts/common";

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
};

export async function apiRequest<TResponse, TBody = undefined>({
  path,
  method = "GET",
  body,
  headers,
  cache = "no-store",
  next,
}: ApiRequestOptions<TBody>): Promise<ApiResult<TResponse>> {
  const url = buildApiUrl(path);

  if (!url) {
    return {
      ok: false,
      status: null,
      error: {
        code: "API_URL_MISSING",
        status: null,
        message: "Brak konfiguracji API_URL dla polaczenia z backendem.",
      },
    };
  }

  try {
    const response = await fetch(url, {
      method,
      cache,
      next,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const rawPayload = await response.text();
    const payload =
      rawPayload.length === 0
        ? null
        : contentType.includes("application/json")
          ? JSON.parse(rawPayload)
          : rawPayload;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: {
          code: "HTTP_ERROR",
          status: response.status,
          message: getErrorMessage(payload, "Backend zwrocil blad odpowiedzi."),
          details: payload,
        },
      };
    }

    if (payload === null || typeof payload !== "object") {
      return {
        ok: false,
        status: response.status,
        error: {
          code: "INVALID_RESPONSE",
          status: response.status,
          message: "Backend zwrocil nieobslugiwany format danych.",
          details: payload,
        },
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload as TResponse,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        status: null,
        error: {
          code: "INVALID_JSON",
          status: null,
          message: "Backend zwrocil niepoprawny JSON.",
          details: error.message,
        },
      };
    }

    return {
      ok: false,
      status: null,
      error: {
        code: "NETWORK_ERROR",
        status: null,
        message: "Nie udalo sie polaczyc z backendem.",
        details: error instanceof Error ? error.message : error,
      },
    };
  }
}
