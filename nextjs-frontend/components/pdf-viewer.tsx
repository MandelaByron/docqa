
"use client"

import { useState, useRef, useEffect } from "react"
import { 
  PDFViewer,
  PDFViewerRef,
  SelectionPlugin,
  ignore,

} from '@embedpdf/react-pdf-viewer';
import { MessageSquare, AlignLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
interface PdfViewerProps {
  url: string,

  // Called when the user clicks a prompt action — injects text into the chat
  onPrompt?: (text: string) => void
}



 
export function PdfViewer({ url, onPrompt }: PdfViewerProps) {
    const viewerRef = useRef<PDFViewerRef>(null) 
    const [selectedText, setSelectedText] = useState("")
    const [hasSelection, setHasSelection] = useState(false)

  // Subscribe to selection changes once the viewer registry is ready
    useEffect(() => {
      const cleanups: (() => void)[] = []
  
      viewerRef.current?.registry?.then((registry) => {
        const selectionPlugin = registry
          .getPlugin<SelectionPlugin>("selection")
          ?.provides()
  
        // "doc" must match the documentId in initialDocuments below
        const scope = selectionPlugin?.forDocument("doc")
        if (!scope) return
  
        cleanups.push(
          scope.onSelectionChange((currentSelection) => {
            setHasSelection(!!currentSelection)
  
            if (currentSelection) {
              scope.getSelectedText().wait((lines) => {
                setSelectedText(lines.join(" "))
              }, ignore)
            } else {
              setSelectedText("")
            }
          }),
        )
      })
  
      return () => cleanups.forEach((fn) => fn())
    }, [])



    const handlePrompt = (prefix: string) => {
      if (!selectedText || !onPrompt) return
      onPrompt(`${prefix}:\n\n"${selectedText}"`)
      // Clear selection after sending
      viewerRef.current?.registry?.then((registry) => {
        registry.getPlugin<SelectionPlugin>("selection")?.provides()
          .forDocument("doc")?.clear()
      })
    }
    return (
      <div className="relative flex flex-col h-full border-r border-white/6">
   
        {/* Selection action bar — floats above the toolbar when text is selected */}
        <div
          className={cn(
            "absolute top-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-1.5 px-2 py-2",
            "bg-[#1a1a1e] border border-white/10 rounded-xl shadow-xl shadow-black/50",
            "transition-all duration-150",
            hasSelection
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-1 pointer-events-none",
          )}
        >   
          <div className="w-px h-8 bg-white/8 mx-0.5" />
   
          <button
            onClick={() => handlePrompt("Explain this")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium text-white/65 hover:text-white/90 hover:bg-white/[0.07] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.7} />
            Explain
          </button>
   
          <button
            onClick={() => handlePrompt("Summarise this")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium text-white/65 hover:text-white/90 hover:bg-white/[0.07] transition-colors"
          >
            <AlignLeft className="h-3.5 w-3.5" strokeWidth={1.7} />
            Summarise
          </button>
   
          <button
            onClick={() => {
              viewerRef.current?.registry?.then((registry) => {
                registry.getPlugin<SelectionPlugin>("selection")?.provides()
                  .forDocument("doc")?.clear()
              })
            }}
            className="flex items-center justify-center h-6 w-6 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/6 transition-colors ml-0.5"
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
   
        {/* PDF viewer */}
        <PDFViewer
          ref={viewerRef}
          config={{
            documentManager: {
              initialDocuments: [{ url, documentId: "doc" }],
            },
            theme: {
              preference: "dark",
              dark: {
                accent: {
                  primary:           "#ffffff",
                  primaryHover:      "rgba(255,255,255,0.85)",
                  primaryActive:     "rgba(255,255,255,0.7)",
                  primaryLight:      "rgba(255,255,255,0.06)",
                  primaryForeground: "#0e0e10",
                },
                background: {
                  app:     "#0e0e10",
                  surface: "#141416",
                },
              },
            },
            disabledCategories: ["annotation", "redaction", "export", "document-open", "document-close"],
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    )
  }