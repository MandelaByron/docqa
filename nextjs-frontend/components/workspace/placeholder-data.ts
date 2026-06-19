import type { WorkspaceRead, DocumentRead, ChatRead } from "../../lib/types"

export const PLACEHOLDER_WORKSPACE: WorkspaceRead = {
  id: "ws-001",
  name: "Q3 Financial Review",
  plan: "free",
  doc_count: 3,
  storage_quota_bytes: 524288000,
  is_personal: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const PLACEHOLDER_DOCUMENTS: DocumentRead[] = [
  {
    id: "doc-001",
    workspace_id: "ws-001",
    filename: "Nike_Annual_Report_2023.pdf",
    file_url: "https://snippet.embedpdf.com/ebook.pdf",
    mime_type: "application/pdf",
    size_bytes: 4200000,
    status: "ready",
    error_message: null,
    chunk_count: 142,
    created_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  },
  {
    id: "doc-002",
    workspace_id: "ws-001",
    filename: "Q3_Earnings_Call_Transcript.pdf",
    file_url: "https://snippet.embedpdf.com/ebook.pdf",
    mime_type: "application/pdf",
    size_bytes: 890000,
    status: "processing",
    error_message: null,
    chunk_count: 0,
    created_at: new Date().toISOString(),
    processed_at: null,
  },
  {
    id: "doc-003",
    workspace_id: "ws-001",
    filename: "Competitor_Analysis_2023.pdf",
    file_url: null,
    mime_type: "application/pdf",
    size_bytes: 1100000,
    status: "failed",
    error_message: "Ingestion timed out.",
    chunk_count: 0,
    created_at: new Date().toISOString(),
    processed_at: null,
  },
]

export const PLACEHOLDER_CHAT: ChatRead = {
  id: "chat-ws-001",
  workspace_id: "ws-001",
  document_id: null,
  title: "Q3 Financial Review — workspace chat",
  created_at: new Date().toISOString(),
}