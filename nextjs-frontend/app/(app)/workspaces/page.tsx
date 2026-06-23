"use client"

import Link from "next/link"
import { FolderOpen, FileText } from "lucide-react"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces(true) // enabled=true — fetch on mount

  return (
    <main className="flex flex-col flex-1 px-6 py-8 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold text-white/90 tracking-tight">
            Workspaces
          </h1>
          <p className="text-[13px] text-white/35 mt-0.5">
            Group documents and chat across collections
          </p>
        </div>

        <CreateWorkspaceDialog variant="button" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading || !workspaces ? (
          // Loading skeleton — only shown on a true cold fetch.
          // If the sidebar already warmed the cache, this branch is skipped
          // entirely and the grid renders instantly from cache.
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[124px] rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse"
            />
          ))
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="group flex flex-col gap-4 p-4 rounded-xl border border-white/[0.07] bg-[#141416] hover:border-white/[0.14] hover:bg-white/[0.03] transition-all duration-150"
            >
              {/* Icon + name */}
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.05] border border-white/[0.07] shrink-0 mt-0.5">
                  <FolderOpen className="h-4 w-4 text-white/35" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-white/85 truncate leading-tight">
                    {ws.name}
                  </p>
                  {ws.is_personal && (
                    <span className="text-[10.5px] text-white/25 mt-0.5 block">Personal</span>
                  )}
                </div>
              </div>

              {/* Doc count */}
              <div className="flex items-center gap-1.5 text-white/25">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.7} />
                <span className="text-[11.5px]">
                  {ws.chat_count} {ws.chat_count === 1 ? "chat" : "chats"}
                </span>
              </div>
            </Link>
          ))
        )}

        {/* New workspace card */}
        {!isLoading && <CreateWorkspaceDialog variant="card" />}
      </div>

    </main>
  )
}