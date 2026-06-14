"use client"

import { FolderOpen } from "lucide-react"

export function WorkspaceEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 min-h-0">
      <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white/4 border border-white/6">
        <FolderOpen className="h-5 w-5 text-white/20" strokeWidth={1.6} />
      </span>

      <div className="flex flex-col items-center gap-1">
        <p className="text-[13.5px] font-medium text-white/50">
          Empty folder
        </p>
        <p className="text-[12px] text-white/25">
          Drag existing chats from the sidebar
        </p>
      </div>
    </div>
  )
}