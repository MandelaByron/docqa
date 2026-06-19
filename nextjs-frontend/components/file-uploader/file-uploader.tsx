"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateUploadDropzone } from "@uploadthing/react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useCreateChat } from "@/hooks/use-chats"
import { useProcessDocument } from "@/hooks/use-documents"
import { ApiError } from "@/lib/api-client"
import type { DocumentRead } from "@/lib/types"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export function FileUploader() {
  const router = useRouter()
  const processDocument = useProcessDocument()
  const createChat = useCreateChat()

  const [docRecord, setDocRecord] = useState<DocumentRead | null>(null)

  const isProcessing = processDocument.isPending
  const isCreatingChat = createChat.isPending
  const isReady = !!docRecord && !isProcessing
  const isBusy = isProcessing || isCreatingChat

  const handleUploadComplete = async (file: {
    url: string
    name: string
    mimeType: string
  }) => {
    setDocRecord(null)

    try {
      const record = await processDocument.mutateAsync({
        url: file.url,
        filename: file.name,
        mime_type: file.mimeType,
      })

      setDocRecord(record)

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
    }
  }

  const handleStartChat = async () => {
    if (!docRecord) return

    try {
      const chat = await createChat.mutateAsync({ documentId: docRecord.id })
      router.push(`/chat/${chat.id}`)
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Could not start chat."
      toast.error("Error", { description: message, position: "top-right" })
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      <UploadDropzone
        endpoint="documentUploader"
        disabled={isBusy}
        appearance={{
          container: cn(
            "rounded-xl border border-dashed border-white/[0.12] bg-[#141416]",
            "hover:border-white/20 transition-colors duration-150",
            "ut-ready:border-white/[0.08] ut-uploading:border-white/20",
            isBusy && "pointer-events-none opacity-60",
          ),
          uploadIcon: "text-white/20",
          label: "text-white/30 text-[13.5px] hover:text-white/50",
          allowedContent: "text-white/20 text-[11px]",
          button: cn(
            "mb-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-150",
            "bg-fuchsia-800 hover:bg-fuchsia-700 active:scale-[0.98]",
            "shadow-sm hover:shadow-md",
            "ut-uploading:opacity-70 ut-uploading:cursor-not-allowed",
          ),
        }}
        content={{
          label: docRecord ? docRecord.filename : "Drop a file here",
          allowedContent: "PDF, DOC, DOCX, TXT — up to 32MB",
        }}
        onClientUploadComplete={(res) => {
          const { url, name, mimeType } = res[0].serverData
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

      {isReady && (
        <p className="text-center text-[12px] text-white/35">
          Ready — start a chat with{" "}
          <span className="text-white/55">{docRecord.filename}</span>
        </p>
      )}

      <div className="flex gap-2">
        <Button
          disabled={!isReady || isBusy}
          onClick={handleStartChat}
          className={cn(
            "flex-1 h-9 text-[13px] font-medium gap-2 transition-all duration-150",
            isReady && !isBusy
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/[0.06] text-white/40 cursor-not-allowed hover:bg-white/[0.06]",
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
          {isProcessing
            ? "Processing…"
            : isCreatingChat
              ? "Starting chat…"
              : "Start chatting"}
        </Button>
      </div>
    </div>
  )
}
