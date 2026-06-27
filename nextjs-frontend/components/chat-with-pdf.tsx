"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type UIMessage } from "ai"
import { PdfViewer } from "@/components/pdf-viewer"
import { Chat } from "@/components/chat-page"
import { MobileMainNav } from "@/components/mobile-main-nav"
import { MobileChatNav } from "@/components/mobile-chat-nav"
import { useViewMode } from "./providers/view-mode-provider"
import type { DocumentRead } from "@/lib/types"
interface ChatWithPdfProps {
  chatId: string
  chatTitle: string
  initialMessages: UIMessage[]
  documents: DocumentRead[]
}

export function ChatWithPdf({
    chatId,
    chatTitle,
    initialMessages,
    documents,
  }: ChatWithPdfProps) {
    const router = useRouter()
    const [injectedPrompt, setInjectedPrompt] = useState("")
    // Which panel is visible on mobile — chat is default
    const { viewMode, setViewMode } = useViewMode()
    const [activePanel, setActivePanel] = useState<"chat" | "pdf">("chat")
   
    const handleDeleted = () => router.push("/")
    const firstDoc     = documents[0] ?? null
    const readyDoc     = documents.find((d) => d.status === "ready" && d.file_url)
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
   
        {/* ── Mobile navbars (hidden on md+) ── */}
        <div className="md:hidden flex flex-col shrink-0">
          <MobileMainNav />
          <MobileChatNav
            chatId={chatId}
            chatTitle={chatTitle}
            hasPdf={!!readyDoc}
            activePanel={activePanel}
            onTogglePanel={() =>
              setActivePanel((p) => (p === "chat" ? "pdf" : "chat"))
            }
            onDeleted={handleDeleted}
          />
        </div>
  
        {/* ── Main content area ── */}
        <main className="flex flex-1 min-h-0 overflow-hidden">
   
          {/* PDF viewer */}
          {readyDoc && (
            <div
              className={[
                // Desktop: always visible left half
                "md:flex md:w-1/2 min-h-0 flex-col",
                // Mobile: visible only when activePanel === "pdf"
                //activePanel === "pdf" ? "flex flex-1" : "hidden",
              ].join(" ")}
            >
              <PdfViewer
                url={readyDoc.file_url}
                onPrompt={(text) => {
                  setInjectedPrompt(text)
                  //setViewMode("split")
                  //setActivePanel("chat")   // switch to chat after injecting
                }}
              />
            </div>
          )}
   
          {/* Chat panel */}
          <div
            className={[
              // Desktop: right half (or full width if no PDF)
              readyDoc ? "md:flex md:flex-none md:w-1/2" : "md:flex md:flex-1",
              "flex-col min-h-0",
              // Mobile: visible only when activePanel === "chat"
              //activePanel === "chat" ? "flex flex-1" : "hidden",
            ].join(" ")}
          >
            <Chat
              chatId={chatId}
              initialMessages={initialMessages}
              injectedPrompt={injectedPrompt}
              onInjectedPromptConsumed={() => setInjectedPrompt("")}
            />
          </div>
   
        </main>
      </div>
    )
  }
