export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiErrorCode =
  | "API_URL_MISSING"
  | "NETWORK_ERROR"
  | "INVALID_JSON"
  | "INVALID_RESPONSE"
  | "HTTP_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  status: number | null;
  details?: unknown;
};

export type ApiSuccess<TData> = {
  ok: true;
  data: TData;
  status: number;
};

export type ApiFailure = {
  ok: false;
  error: ApiError;
  status: number | null;
};

export type ApiResult<TData> = ApiSuccess<TData> | ApiFailure;

export type PaginatedResponse<TItem> = {
  data: TItem[];
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
  };
};

export type ApiRequestOptions<TBody = undefined> = {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};
