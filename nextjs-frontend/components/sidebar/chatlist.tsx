"use client"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useChats, useDeleteChat } from "@/hooks/use-chats"

import Link from "next/link"

import { ChatRead } from "@/lib/types"
import { cn } from "@/lib/utils"

import DeleteChatDialog from "../delete-dialog"

import { MessagesSquare, MoreHorizontal, Trash2 } from "lucide-react"
import { 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton,
} from "../ui/sidebar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"



export default function ChatList() {
    const pathname = usePathname()
    const router = useRouter()
    const {
        data: chats = [],
        isLoading,
      } = useChats()
    const deleteChat = useDeleteChat()
    const [pendingDelete, setPendingDelete] = useState<ChatRead | null>(null)
  
    const handleDeleteConfirm = async () => {
      if (!pendingDelete) return
      try {
        await deleteChat.mutateAsync(pendingDelete.id)
        if (pathname === `/chat/${pendingDelete.id}`) {
          router.push("/")
        }
      } catch {
        // handle error silently — could add a toast here
      } finally {
        setPendingDelete(null)
      }
    }

  
    if (isLoading) {
      return (
        <div className="px-4 py-2 space-y-2 group-data-[collapsible=icon]:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded bg-white/4 animate-pulse" />
          ))}
        </div>
      )
    }
  
    if (chats.length === 0) {
      return (
        <p className="px-4 py-2 text-[11.5px] text-white/20 group-data-[collapsible=icon]:hidden">
          No chats yet
        </p>
      )
    }
  
    return (
      <>
        <SidebarMenu className="gap-0">
          {chats.map((chat) => {
            const isActive = pathname === `/chat/${chat.id}`
            return (
              <SidebarMenuItem key={chat.id}>
                <div className="group/item relative flex items-center">
                  <SidebarMenuButton
                    asChild
                    tooltip={chat.title}
                    className={cn(
                      "relative h-8 rounded-lg px-2.5 text-[13px] transition-all duration-150 pr-8",
                      isActive
                        ? "text-white/90 bg-white/[0.08]"
                        : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]",
                    )}
                  >
                    <Link href={`/chat/${chat.id}`} className="flex items-center gap-2.5 min-w-0">
                      <MessagesSquare
                        className="h-[15px] w-[15px] shrink-0 text-white/30"
                        strokeWidth={1.7}
                      />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
  
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        "absolute right-1.5 flex items-center justify-center",
                        "h-5 w-5 rounded-md",
                        "text-white/0 group-hover/item:text-white/35",
                        "hover:text-white/70! hover:bg-white/[0.07]",
                        "transition-all duration-100 outline-none",
                        "group-data-[collapsible=icon]:hidden",
                      )}
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                      onClick={() => setPendingDelete(chat)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-red-400/80 hover:text-red-300 hover:bg-red-500/8 cursor-pointer transition-colors outline-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        <DeleteChatDialog
          open={!!pendingDelete}
          chatTitle={pendingDelete?.title ?? ""}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      </>
    )
  }


