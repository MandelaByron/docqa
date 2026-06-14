// view-mode-context.tsx

"use client"

import { createContext, useContext, useState } from "react"

export type ViewMode = "split" | "pdf-only" | "chat-only"

type ViewModeContextType = {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextType | null>(null)

export function ViewModeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("split")

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)

  if (!ctx) {
    throw new Error("useViewMode must be used inside ViewModeProvider")
  }

  return ctx
}