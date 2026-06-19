"use client"

import Link from "next/link"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserButton, SignInButton, useUser } from "@clerk/nextjs"
import { Columns2, MessageSquare, FileText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useViewMode } from "../providers/view-mode-provider"

export type ViewMode = "split" | "pdf-only" | "chat-only"

const VIEW_BUTTONS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: "pdf-only",   icon: FileText,  label: "PDF only"  },
  { mode: "split",      icon: Columns2,  label: "Side by side" },
  { mode: "chat-only",  icon: MessageSquare, label: "Chat only" },
]

export function Navbar() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { viewMode, setViewMode } = useViewMode()

  return (
    <header className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-white/[0.06] bg-[#0e0e10]">

      {/* Left — sidebar trigger + logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="flex items-center justify-center h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-indigo-600">
            <Sparkles className="h-2.5 w-2.5 text-white" strokeWidth={2.2} />
          </span>
          <span className="text-[13px] font-semibold text-white/70">DocQA</span>
        </Link>
      </div>

      <div className="flex items-center gap-1 rounded-lg p-0.5 border border-white/6 bg-white/4">
        {VIEW_BUTTONS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-label={label}
              title={label}
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-md transition-all duration-150",
                viewMode === mode
                  ? "bg-white/10 text-white/80"
                  : "text-white/30 hover:text-white/60",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          ))}
      </div>
      {/* Right — auth */}
      <div className="flex items-center">
        {!isLoaded ? null : isSignedIn ? (
          <UserButton
            appearance={{
              elements: { avatarBox: "h-7 w-7 rounded-full ring-1 ring-white/10" },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <button className="h-7 px-3 rounded-lg text-[12px] font-medium text-white/55 hover:text-white/90 hover:bg-white/[0.06] border border-white/[0.08] transition-colors">
              Sign in
            </button>
          </SignInButton>
        )}
      </div>

    </header>
  )
}