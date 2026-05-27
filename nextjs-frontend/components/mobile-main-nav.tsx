"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MessageSquarePlus, Search, LayoutGrid } from "lucide-react"

const navItems = [
  { icon: MessageSquarePlus, href: "/",  label: "New Chat"   },
  { icon: Search,            href: "#",  label: "Search"     },
  { icon: LayoutGrid,        href: "#",  label: "Workspaces" },
]

export function MobileMainNav() {
  return (
    <header className="flex items-center justify-between px-3 h-12 border-b border-white/[0.06] bg-[#0e0e10]">
      {/* Left: sidebar trigger + wordmark */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-white/40 hover:text-white/80 transition-colors" />
        <span className="font-semibold text-[15px] tracking-tight text-white/90">
          DocQA
        </span>
      </div>

      {/* Right: nav icons */}
      <div className="flex items-center gap-0.5">
        {navItems.map(({ icon: Icon, href, label }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
          </Link>
        ))}
      </div>
    </header>
  )
}