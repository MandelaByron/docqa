// hooks/use-api-client.ts
//
// Returns a stable API client pre-loaded with the current Clerk session token.
// Use this in any component that needs to call FastAPI:
//
//   const api = useApiClient()
//   const doc = await api.post<DocumentRead>(...)

import { useAuth } from "@clerk/nextjs"
import { useCallback } from "react"
import { createApiClient } from "@/lib/api-client"

export function useApiClient() {
  const { getToken } = useAuth()

  // getToken() is async — we return an async wrapper so callers can just
  // await api.post(...) without thinking about token resolution.
  const post = useCallback(
    async <T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> => {
      const token = await getToken()
      return createApiClient(token).post<T>(path, body, params)
    },
    [getToken],
  )

  const get = useCallback(
    async <T>(path: string, params?: Record<string, string>): Promise<T> => {
      const token = await getToken()
      return createApiClient(token).get<T>(path, params)
    },
    [getToken],
  )

  const patch = useCallback(
    async <T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> => {
      const token = await getToken()
      return createApiClient(token).patch<T>(path, body, params)
    },
    [getToken],
  )

  const del = useCallback(
    async <T>(path: string, params?: Record<string, string>): Promise<T> => {
      const token = await getToken()
      return createApiClient(token).delete<T>(path, params)
    },
    [getToken],
  )

  return { get, post, patch, delete: del }
}