"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarTrigger,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageSquarePlus,MessagesSquare, Search, LayoutGrid,  MoreHorizontal, Trash2 } from "lucide-react"
import DeleteChatDialog from "./delete-dialog"
import { SignInButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { UserButton } from "@clerk/nextjs";
import { useApiClient } from "@/hooks/use-api-client"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "New Chat",   icon: MessageSquarePlus, href: "#" },
  { label: "Search",     icon: Search,            href: "#" },
  { label: "Workspaces", icon: LayoutGrid,         href: "#" },
]

interface ChatRead {
  id: string
  document_id: string
  title: string
  created_at: string
}
 

// ─── Unauthenticated footer ───────────────────────────────────────────────────
function GuestFooter() {
  return (
    <SidebarFooter className="px-2 py-3 border-t border-white/[0.05]">
      <SidebarMenu>
        <SidebarMenuItem>
          <SignInButton mode="modal">
            <SidebarMenuButton
              tooltip="Sign in"
              className="group h-auto w-full rounded-xl px-2.5 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors duration-150"
            >
              {/* Placeholder avatar ring */}
              <span className="h-7 w-7 shrink-0 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                <span className="text-[10px] text-white/30">?</span>
              </span>

              {/* Label — hidden when collapsed */}
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-[13px] font-medium text-white/60 leading-tight">
                  Sign in
                </span>
                <span className="text-[11px] text-white/25 leading-tight mt-0.5">
                  to save your chats
                </span>
              </div>
            </SidebarMenuButton>
          </SignInButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

// ─── Authenticated footer ─────────────────────────────────────────────────────
function UserFooter() {
  const { user } = useUser()
  if (!user) return null

  const displayName =
    user.fullName ??
    user.firstName ??
    user.username ??
    "User"

  const email = user.primaryEmailAddress?.emailAddress ?? ""
  const plan = (user.publicMetadata?.plan as string) ?? "Free Plan"

  return (
    <SidebarFooter className="px-2 py-3 border-t border-white/5">
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            {/* Clerk's UserButton — handles avatar, click → modal */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 rounded-full ring-1 ring-white/10",
                },
              }}
            />

            {/* Name + plan — hidden when sidebar is collapsed to icon */}
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="truncate text-[13px] font-medium text-white/85 leading-tight">
                {displayName}
              </span>
              <span className="truncate text-[11px] text-white/35 leading-tight mt-0.5">
                {plan}
              </span>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

// ─── Chat list ────────────────────────────────────────────────────────────────
 
function ChatList() {
  const api = useApiClient()
  const pathname = usePathname()
  const router = useRouter()
  const [chats, setChats] = useState<ChatRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<ChatRead | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      await api.delete(`/chats/${pendingDelete.id}`)
      setChats((prev) => prev.filter((c) => c.id !== pendingDelete.id))
      // If the user is currently in the deleted chat, navigate home
      if (pathname === `/chat/${pendingDelete.id}`) {
        router.push("/")
      }
    } catch {
      // handle error silently — could add a toast here
    } finally {
      setIsDeleting(false)
      setPendingDelete(null)
    }
  }

  useEffect(() => {
    api.get<ChatRead[]>("/chats/fetch_chats")
      .then(setChats)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  // Re-fetch when the user navigates (e.g. after creating a new chat)
  }, [pathname])
 
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
              {/* Wrapper allows hover to reveal the dropdown trigger */}
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
 
                {/* Dropdown trigger — appears on row hover */}
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
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={6}
                    className="w-36 bg-[#141416] border border-white/8 rounded-xl p-1 shadow-xl shadow-black/40"
                  >
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
 
      {/* Confirmation dialog — rendered once, driven by pendingDelete state */}
      <DeleteChatDialog
        open={!!pendingDelete}
        chatTitle={pendingDelete?.title ?? ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="px-4 py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton
                asChild
                className="h-auto hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:hidden"
              >
                <a href="#">
                  <span className="font-semibold tracking-tight text-white/90 text-[15px]">
                    DocQA
                  </span>
                </a>
              </SidebarMenuButton>
              <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors duration-150" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0.5">
            {navItems.map(({ label, icon: Icon, href }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  asChild
                  tooltip={label}
                  className="relative h-9 rounded-lg px-2.5 text-[13.5px] font-medium text-white/55 hover:text-white/90 hover:bg-white/[0.06] active:bg-white/[0.09] transition-all duration-150"
                >
                  <a href={href} className="flex items-center gap-3">
                    <Icon className="h-[17px] w-[17px] shrink-0 text-white/40" strokeWidth={1.8} />
                    <span>{label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {/* Chat history — only shown when signed in */}
        {isSignedIn && (
          <SidebarGroup className="p-0 mt-4">
            <SidebarGroupLabel className="px-2 mb-1 text-[11px] font-medium tracking-widest uppercase text-white/20 group-data-[collapsible=icon]:hidden">
              Recent chats
            </SidebarGroupLabel>
            <ChatList />
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer — switches on auth state, nothing renders while Clerk loads */}
      {!isLoaded ? null : isSignedIn ? <UserFooter /> : <GuestFooter />}
    </Sidebar>
  )
}