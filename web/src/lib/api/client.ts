import type { ApiErrorBody } from "./types";

/** Backend base URL (API Gateway / Lambda Function URL). Set per environment. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type QueryValue = string | number | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Cognito bearer token for admin endpoints. */
  token?: string;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!API_BASE) {
    throw new ApiError(
      0,
      "api_unconfigured",
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

/**
 * Typed fetch wrapper. Serializes JSON, attaches the bearer token, and turns
 * non-2xx responses into a typed {@link ApiError}. Returns `undefined` for 204.
 */
export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, query, signal } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return undefined as T;

  let data: unknown;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(
      res.status,
      "invalid_json",
      "API returned a non-JSON response. Check NEXT_PUBLIC_API_URL.",
    );
  }

  if (!res.ok) {
    let code = "unknown";
    let message = res.statusText;
    const errorBody = data as Partial<ApiErrorBody> | undefined;
    if (errorBody?.error) {
      code = errorBody.error.code ?? code;
      message = errorBody.error.message ?? message;
    }
    throw new ApiError(res.status, code, message);
  }

  return data as T;
}
