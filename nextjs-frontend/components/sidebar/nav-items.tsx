
import { 
    SidebarGroup, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem } 
    
from '../ui/sidebar'


import { MessageSquarePlus, Search } from "lucide-react"

const navItems = [
    { label: "New Chat",   icon: MessageSquarePlus, href: "#" },
    { label: "Search",     icon: Search,            href: "#" },
  ]
const NavItems = () => {
  return (
    <SidebarGroup className="p-0">
        <SidebarMenu className="gap-0.5">
        {navItems.map(({ label, icon: Icon, href }) => (
            <SidebarMenuItem key={label}>
            <SidebarMenuButton
                asChild
                tooltip={label}
                className="relative h-9 rounded-lg px-2.5 text-[13.5px] font-medium text-white/55 hover:text-white/90 hover:bg-white/6 active:bg-white/9 transition-all duration-150"
            >
                <a href={href} className="flex items-center gap-3">
                <Icon className="h-4.25 w-4.25 shrink-0 text-white/40" strokeWidth={1.8} />
                <span>{label}</span>
                </a>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
    </SidebarGroup>
  )
}

export default NavItems