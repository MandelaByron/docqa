
import type { WorkspaceRead, ChatRead, DocumentRead } from "@/components/workspace/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

// ─── Workspaces ───────────────────────────────────────────────────────────────

export async function loadWorkspaces(token: string): Promise<WorkspaceRead[]> {
  const res = await fetch(`${API_URL}/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return []
  return res.json()
}

export async function loadWorkspace(
  workspaceId: string,
  token: string,
): Promise<WorkspaceRead | null> {
  const res = await fetch(`${API_URL}/workspaces/${workspaceId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function loadDocument(
  documentId: string,
  token: string,
): Promise<DocumentRead | null> {
  const res = await fetch(`${API_URL}/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}