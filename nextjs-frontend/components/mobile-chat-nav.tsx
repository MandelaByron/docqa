
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, MessageSquare, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApiClient } from "@/hooks/use-api-client"
import DeleteChatDialog from "@/components/delete-dialog"

interface MobileChatNavProps {
  chatId: string
  chatTitle: string
  hasPdf: boolean
  activePanel: "chat" | "pdf"
  onTogglePanel: () => void
  onDeleted: () => void
}

export function MobileChatNav({
  chatId,
  chatTitle,
  hasPdf,
  activePanel,
  onTogglePanel,
  onDeleted,
}: MobileChatNavProps) {
  const api = useApiClient()
  const [pendingDelete, setPendingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await api.delete(`/chats/${chatId}`)
      onDeleted()
    } catch {
      // silent — could add toast later
    } finally {
      setIsDeleting(false)
      setPendingDelete(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.04] bg-[#0e0e10]">

        {/* Chat title */}
        <p className="text-[13px] font-medium text-white/60 truncate max-w-[55%]">
          {chatTitle}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-0.5">

          {/* PDF ↔ Chat toggle — only when a PDF is attached */}
          {hasPdf && (
            <button
              onClick={onTogglePanel}
              className={cn(
                "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium transition-colors",
                activePanel === "pdf"
                  ? "bg-white/[0.08] text-white/80"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]",
              )}
              aria-label="Toggle PDF viewer"
            >
              {activePanel === "chat" ? (
                <>
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.7} />
                  <span>PDF</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.7} />
                  <span>Chat</span>
                </>
              )}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => setPendingDelete(true)}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-white/25 hover:text-red-400/70 hover:bg-red-500/8 transition-colors"
            aria-label="Delete chat"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {/* Reuse existing delete dialog */}
      <DeleteChatDialog
        open={pendingDelete}
        chatTitle={chatTitle}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(false)}
      />
    </>
  )
}