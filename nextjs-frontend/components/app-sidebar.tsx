"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarTrigger,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { MessageSquarePlus, Search, LayoutGrid } from "lucide-react"
import { SignInButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { label: "New Chat",   icon: MessageSquarePlus, href: "#" },
  { label: "Search",     icon: Search,            href: "#" },
  { label: "Workspaces", icon: LayoutGrid,         href: "#" },
]

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
      </SidebarContent>

      {/* Footer — switches on auth state, nothing renders while Clerk loads */}
      {!isLoaded ? null : isSignedIn ? <UserFooter /> : <GuestFooter />}
    </Sidebar>
  )
}