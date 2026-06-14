"use client"

import Link from "next/link"
import { Columns2, MessageSquare, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"

export type ViewMode = "split" | "pdf-only" | "chat-only"

interface WorkspaceTopNavProps {
  title: string
  fileCount: number
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

const VIEW_BUTTONS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: "pdf-only",   icon: FileText,  label: "PDF only"  },
  { mode: "split",      icon: Columns2,  label: "Side by side" },
  { mode: "chat-only",  icon: MessageSquare, label: "Chat only" },
]

export function WorkspaceTopNav({
  title,
  fileCount,
  viewMode,
  onViewModeChange,
}: WorkspaceTopNavProps) {
  return (
    <header className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-white/[0.06] bg-[#0e0e10]">

      {/* Left — sidebar trigger + logo + title */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="md:hidden text-white/40 hover:text-white/80 transition-colors shrink-0" />

        {/* Workspace title + file count */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13.5px] font-medium text-white/85 truncate">
            {title}
          </span>
          <span className="text-[11px] text-white/25 shrink-0 tabular-nums">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
        </div>
      </div>

    </header>
  )
}