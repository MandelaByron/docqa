import { UUID } from "crypto"

export interface ChatRead {
  id: UUID
  workspace_id: string | null
  document_id: string | null
  title: string
  created_at: string
  documents: DocumentRead[]
}

export interface WorkspaceRead {
  id: string
  name: string
  owner_id: string
  plan: string
  doc_count: number
  storage_quota_bytes: number
  is_personal: boolean
  created_at: string
  chats: ChatRead[]   // ← included by the API directly on the workspace
  chat_count: number
}

export interface DocumentRead {
  id: string
  workspace_id: string | null
  filename: string
  file_url: string
  mime_type: string
  size_bytes: number
  status: "pending" | "processing" | "ready" | "failed"
  error_message: string | null
  chunk_count: number
  created_at: string
  processed_at: string | null
}