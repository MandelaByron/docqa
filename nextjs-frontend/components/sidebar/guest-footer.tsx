import { SignInButton } from "@clerk/nextjs";
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export default function GuestFooter(){    return (
        <SidebarFooter className="px-2 py-3 border-t border-white/5">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SignInButton mode="modal">
                        <SidebarMenuButton>
                            <span className="h-7 w-7 shrink-0 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                                <span className="text-[10px] text-white/30">?</span>
                            </span>
                            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                                <span className="text-[13px] font-medium text-white/60 leading-tight">
                                    Sign in
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SignInButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    )
}