// lib/api-client.ts
//
// Thin wrapper around fetch that:
//   - Prefixes every request with the FastAPI base URL
//   - Injects the Clerk Bearer token when provided
//   - Throws a typed ApiError on non-2xx responses
//
// Usage:
//   const client = createApiClient(token)
//   const doc    = await client.post<DocumentRead>("/documents/process", body, { workspace_id })
//   const ws     = await client.post<WorkspaceRead>("/workspaces", body)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// ─── Error type ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail)
    this.name = "ApiError"
  }
}

// ─── Internal fetch wrapper ───────────────────────────────────────────────────

type RequestOptions = {
  /** Query-string params — appended to the URL automatically */
  params?: Record<string, string>
  token?: string
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)

  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    // FastAPI returns { detail: "..." } on errors
    let detail = res.statusText
    try {
      const json = await res.json()
      detail = json.detail ?? detail
    } catch {}
    throw new ApiError(res.status, detail)
  }

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Public client factory ────────────────────────────────────────────────────
//
// Call createApiClient(token) inside a component or server action,
// passing the Clerk JWT. All methods are typed generics so callers
// get full autocomplete on the response shape.

export function createApiClient(token: string | null) {
  const opts = (params?: Record<string, string>): RequestOptions => ({
    token: token ?? undefined,
    params,
  })

  return {
    get<T>(path: string, params?: Record<string, string>) {
      return request<T>("GET", path, undefined, opts(params))
    },
    post<T>(path: string, body: unknown, params?: Record<string, string>) {
      return request<T>("POST", path, body, opts(params))
    },
    patch<T>(path: string, body: unknown, params?: Record<string, string>) {
      return request<T>("PATCH", path, body, opts(params))
    },
    delete<T>(path: string, params?: Record<string, string>) {
      return request<T>("DELETE", path, undefined, opts(params))
    },
  }
}