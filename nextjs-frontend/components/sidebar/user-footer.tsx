import { UserButton, useUser } from "@clerk/nextjs";
import { SidebarFooter, SidebarMenu, SidebarMenuItem } from "../ui/sidebar";

export default function UserFooter(){
    const { user } = useUser()
    if (!user) return null
    const plan = (user.publicMetadata?.plan as string) ?? "Free Plan"
    const displayName =
        user.fullName ??
        user.firstName ??
        user.username ??
        "User"

    return (
      <SidebarFooter className="px-2 py-3 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 rounded-full ring-1 ring-white/10",
                  },
                }}
              />
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