"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateUploadDropzone } from "@uploadthing/react"
import { MessageSquare, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useApiClient } from "@/hooks/use-api-client"
import { ApiError } from "@/lib/api-client"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

// ─── Types ────────────────────────────────────────────────────────────────────
// Mirror DocumentRead from FastAPI — extend as the schema grows.

interface DocumentRead {
  id: string
  workspace_id: string
  filename: string
  file_url: string
  mime_type: string
  size_bytes: number
  status: string
  chunk_count: number
  error_message: string | null
  created_at: string
  processed_at: string | null
}

interface ChatRead {
  id: string
  document_id: string
  title: string
  created_at: string
}

interface UploadedDoc {
  url: string
  name: string
  mimeType: string
}



// ─── Component ────────────────────────────────────────────────────────────────

export function FileUploader() {
  const router = useRouter()
  const api    = useApiClient()

  const [doc,        setDoc]        = useState<UploadedDoc | null>(null)
  const [docRecord,  setDocRecord]  = useState<DocumentRead | null>(null)
  const [isReady,    setIsReady]    = useState(false)
  const [isWorking,  setIsWorking]  = useState(false)   // POST /process in-flight

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleUploadComplete = async (file: { url: string; name: string; mimeType: string }) => {
    setDoc(file)

    // POST to FastAPI immediately after Uploadthing finishes
    setIsWorking(true)
    try {
      const record = await api.post<DocumentRead>(
        "/documents/process",
        {
          url:       file.url,
          filename:  file.name,
          mime_type: file.mimeType,
        }
      )

      setDocRecord(record)
      setIsReady(true)

      toast.success("File uploaded", {
        description: `${file.name} is being processed.`,
        position: "top-right",
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Something went wrong."
      toast.error("Processing failed", {
        description: message,
        position: "top-right",
      })
    } finally {
      setIsWorking(false)
    }
  }

  const handleStartChat = async () => {
    if (!docRecord) return
    setIsWorking(true)
   
    try {
      const chat = await api.post<ChatRead>("/chats", {
        document_id: docRecord.id,
      })
      router.push(`/chat/${chat.id}`)
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Could not start chat."
      toast.error("Error", { description: message, position: "top-right" })
    } finally {
      setIsWorking(false)
    }
  }
   
  const handleSaveToWorkspace = async () => {
    if (!docRecord) return
    // Placeholder — wire to your workspace-save endpoint when ready.
    toast.info("Saved to workspace", {
      description: docRecord.filename,
      position: "top-right",
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      <UploadDropzone
        endpoint="documentUploader"
        appearance={{
          container: cn(
            "rounded-xl border border-dashed border-white/[0.12] bg-[#141416]",
            "hover:border-white/20 transition-colors duration-150",
            "ut-ready:border-white/[0.08] ut-uploading:border-white/20",
          ),
          uploadIcon:     "text-white/20",
          label:          "text-white/30 text-[13.5px] hover:text-white/50",
          allowedContent: "text-white/20 text-[11px]",
          button: cn(
            "mb-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-150",
            "bg-fuchsia-800 hover:bg-fuchsia-700 active:scale-[0.98]",
            "shadow-sm hover:shadow-md",
            "ut-uploading:opacity-70 ut-uploading:cursor-not-allowed",
          ),
        }}
        content={{
          label:          "Drop a file here",
          allowedContent: "PDF, DOC, DOCX, TXT — up to 32MB",
        }}
        onClientUploadComplete={(res) => {
          const { url, name, mimeType } = res[0].serverData  // ← serverData, not res[0] directly
          handleUploadComplete({ url, name, mimeType })
        }}
        onUploadError={(error) => {
          console.error("Upload error:", error)
          toast.error("Upload failed", {
            description: error.message,
            position: "top-right",
          })
        }}
      />

      <div className="flex gap-2">
        <Button
          disabled={!isReady || isWorking}
          onClick={handleStartChat}
          className={cn(
            "flex-1 h-9 text-[13px] font-medium gap-2 transition-all duration-150",
            isReady && !isWorking
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/[0.06] text-white/40 cursor-not-allowed hover:bg-white/[0.06]",
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
          {isWorking ? "Processing…" : "Start chatting"}
        </Button>
      </div>
    </div>
  )
}