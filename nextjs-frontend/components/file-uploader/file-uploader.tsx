"use client"

import { useRouter } from "next/navigation"
import { generateUploadDropzone } from "@uploadthing/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useCreateChat } from "@/hooks/use-chats"
import { useProcessDocument } from "@/hooks/use-documents"
import { ApiError } from "@/lib/api-client"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export function FileUploader() {
  const router = useRouter()
  const createChat = useCreateChat()
  const processDocument = useProcessDocument()

  const isBusy = createChat.isPending || processDocument.isPending

  const handleUploadComplete = async (file: {
    url: string
    name: string
    mimeType: string
  }) => {
    try {
      // Step 1 — create the chat immediately using the filename as title.
      // Strip the extension for a cleaner title e.g. "Nike_Annual_Report_2023"
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      const chat = await createChat.mutateAsync({ title })

      // Step 2 — redirect immediately. Processing happens in the background.
      // useDocumentPolling on the chat page will notify the user when ready.
      router.push(`/chat/${chat.id}`)

      // Step 3 — kick off ingestion after redirect (fire and forget from UI perspective)
      // The chat page polls for completion via useDocumentPolling.
      processDocument.mutate({
        url: file.url,
        filename: file.name,
        mime_type: file.mimeType,
        chat_id: chat.id,
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Something went wrong."
      toast.error("Upload failed", {
        description: message,
        position: "top-right",
      })
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
            "ut-uploading:opacity-70 ut-uploading:cursor-not-allowed",
          ),
        }}
        content={{
          label: "Drop a file here",
          allowedContent: "PDF, DOC, DOCX, TXT — up to 32MB",
        }}
        onClientUploadComplete={(res) => {
          const { url, name, mimeType } = res[0].serverData
          handleUploadComplete({ url, name, mimeType })
        }}
        onUploadError={(error) => {
          toast.error("Upload failed", {
            description: error.message,
            position: "top-right",
          })
        }}
      />
    </div>
  )
}