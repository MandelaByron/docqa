"use client"

import { useState } from "react"
import { ChatRead, WorkspaceRead } from "@/lib/types"
import { DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "../ui/dropdown-menu"
import { FolderInput, FolderOpen } from "lucide-react"
import { useAddChatToWorkspace, useWorkspaces } from "@/hooks/use-workspaces"
import { toast } from "sonner"
import { ApiError } from "@/lib/api-client"

export default function AddToWorkspaceSubmenu({ chat }: { chat: ChatRead }) {
  const [open, setOpen] = useState(false)
  const { data: workspaces = [], isLoading } = useWorkspaces(open)
  const addChatToWorkspace = useAddChatToWorkspace()

  const handleSelect = async (workspace: WorkspaceRead) => {
    try {
      await addChatToWorkspace.mutateAsync({
        workspaceId: workspace.id,
        chatId: chat.id,
        chat,
      })
      toast.success(`Added to ${workspace.name}`, { position: "top-right" })
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Could not add chat to workspace."
      toast.error("Error", { description: message, position: "top-right" })
    }
  }

  return (
    <DropdownMenuSub onOpenChange={setOpen}>
      <DropdownMenuSubTrigger
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-white/55 hover:text-white/85 hover:bg-white/6 cursor-pointer transition-colors outline-none data-[state=open]:bg-white/6 data-[state=open]:text-white/85"
      >
        <FolderInput className="h-3.5 w-3.5" strokeWidth={1.7} />
        Add to workspace
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent
          sideOffset={6}
          className="w-44 bg-[#141416] border border-white/[0.08] rounded-xl p-1 shadow-xl shadow-black/40"
        >
          {isLoading ? (
            <div className="px-2.5 py-2 space-y-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-3 rounded bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <p className="px-2.5 py-2 text-[12px] text-white/25 text-center">
              No workspaces yet
            </p>
          ) : (
            workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleSelect(ws)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-white/55 hover:text-white/85 hover:bg-white/[0.06] cursor-pointer transition-colors outline-none"
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-white/30" strokeWidth={1.7} />
                <span className="truncate">{ws.name}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
