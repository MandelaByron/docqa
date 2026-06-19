"use client"
import { useUser } from "@clerk/nextjs"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarGroupLabel,

  } from "@/components/ui/sidebar"

import NavItems from "./nav-items"
import ChatList from "./chatlist"
import UserFooter from "./user-footer"
import GuestFooter from "./guest-footer"

export function AppSidebar() {
    const { isLoaded, isSignedIn } = useUser()
  
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader>
          ...
        </SidebarHeader>
  
        <SidebarContent>
            <NavItems />
            {isSignedIn && (
            <SidebarGroup>
                <SidebarGroupLabel>
                Recent chats
                </SidebarGroupLabel>
                <ChatList />
            </SidebarGroup>
        )}
        </SidebarContent>
        {!isLoaded ? null : isSignedIn ? (
          <UserFooter />
        ) : (
          <GuestFooter />
        )}
      </Sidebar>
    )
  }