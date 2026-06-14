"use client"

import { useRouter } from "next/navigation"
import { ChevronDown, FileText } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { ChatRead } from "./types"

interface WorkspaceContextBarProps {
  documentChats: ChatRead[]
}

export function WorkspaceContextBar({
  documentChats,
}: WorkspaceContextBarProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between px-4 h-10 shrink-0 border-b border-white/5 bg-[#0e0e10]">
      <p className="text-[12px] text-white/35">
        Chatting with workspace
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] text-white/45 hover:text-white/80 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.07] transition-all duration-150 outline-none">
          Chat with a file
          <ChevronDown
            className="h-3 w-3 text-white/25"
            strokeWidth={2}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-56 bg-[#141416] border border-white/[0.08] rounded-xl p-1.5 shadow-xl shadow-black/40"
        >
          <DropdownMenuLabel className="px-2 py-1 text-[10.5px] font-medium tracking-widest uppercase text-white/20">
            Files
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-white/[0.05] my-1" />

          {documentChats.length === 0 ? (
            <p className="px-2 py-2 text-[12px] text-white/25 text-center">
              No file chats yet
            </p>
          ) : (
            documentChats.map((chat) => (
              <DropdownMenuItem
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] text-white/60 hover:text-white/90 hover:bg-white/[0.06] cursor-pointer transition-colors outline-none"
              >
                <FileText
                  className="h-3.5 w-3.5 shrink-0 text-white/30"
                  strokeWidth={1.7}
                />

                <span className="truncate">
                  {chat.document?.filename ?? chat.title}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}