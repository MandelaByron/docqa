"use client"

import { useState } from "react"
import { WorkspaceTopNav } from "./workspace-top-nav"
import { WorkspaceContextBar } from "./workspace-context-bar"
import { WorkspaceEmptyState } from "./workspace-empty-state"
import { PdfViewer } from "@/components/pdf-viewer"
import { Chat } from "@/components/chat-page"
import { useViewMode } from "../view-mode-context"
import type { WorkspaceRead } from "./types"

interface WorkspacePageProps {
  workspace: WorkspaceRead
}

export function WorkspacePage({ workspace }: WorkspacePageProps) {
  const { viewMode, setViewMode } = useViewMode()
  const [injectedPrompt, setInjectedPrompt] = useState("")

  const isEmpty = workspace.chats.length === 0

  const workspaceChats = workspace.chats
  const documentChats = workspace.chats.filter((chat) => chat.document)
  const firstDoc = workspaceChats[0]?.document
  const fileCount = workspaceChats.length

  const showPdf  = viewMode === "split" || viewMode === "pdf-only"
  const showChat = viewMode === "split" || viewMode === "chat-only"

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Top nav — always visible */}
      <WorkspaceTopNav
        title={workspace.name}
        fileCount={fileCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main content */}
      {isEmpty ? (
        <WorkspaceEmptyState />
      ) : (
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* PDF viewer */}
          {showPdf && firstDoc?.file_url && (
            <div
              className={[
                "flex flex-col min-h-0 border-r border-white/[0.06]",
                viewMode === "pdf-only" ? "flex-1" : "w-1/2",
              ].join(" ")}
            >
              <PdfViewer
                url={firstDoc.file_url}
                onPrompt={(text) => {
                  setInjectedPrompt(text)
                  setViewMode("split")
                }}
              />
            </div>
          )}

          {/* Chat panel */}
          {showChat && (
            <div
              className={[
                "flex flex-col min-h-0",
                viewMode === "chat-only" ? "flex-1" : "w-1/2",
              ].join(" ")}
            >
              <WorkspaceContextBar documentChats={documentChats} />
              <Chat
                chatId={workspace.id}
                injectedPrompt={injectedPrompt}
                onInjectedPromptConsumed={() => setInjectedPrompt("")}
              />
            </div>
          )}

        </div>
      )}
    </div>
  )
}