import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Navbar } from "@/components/layout/navbar"
import { ViewModeProvider } from "@/components/providers/view-mode-provider"
import { QueryProvider } from "@/components/providers/query-provider"


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // h-full propagates the height chain from root into this layout
    <QueryProvider>
      <SidebarProvider className="h-full">
        <ViewModeProvider>
          <AppSidebar />
          {/*
            SidebarInset must be a flex-1 column that fills remaining space.
            overflow-hidden prevents double scrollbars — the Thread handles its own scroll.
          */}
          <SidebarInset className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <Navbar />
            {children}
          </SidebarInset>
        </ViewModeProvider>

      </SidebarProvider>
    </QueryProvider>

  )
}