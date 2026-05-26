
"use client"

// import { useState } from "react"
// import { Document, Page, pdfjs } from "react-pdf"
// import { ChevronLeft, ChevronRight } from "lucide-react"
// import { cn } from "@/lib/utils"

// import "react-pdf/dist/Page/AnnotationLayer.css"
// import "react-pdf/dist/Page/TextLayer.css"

// // Point to the worker bundled with react-pdf
// pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
  url: string
}

// export function PdfViewer({ url }: PdfViewerProps) {
//   const [numPages, setNumPages]   = useState<number>(0)
//   const [pageNumber, setPageNumber] = useState(1)

//   const onLoadSuccess = ({ numPages }: { numPages: number }) => {
//     setNumPages(numPages)
//     setPageNumber(1)
//   }

//   const prev = () => setPageNumber((p) => Math.max(1, p - 1))
//   const next = () => setPageNumber((p) => Math.min(numPages, p + 1))

//   return (
//     <div className="flex flex-col h-full bg-[#0e0e10] border-r border-white/6">

//       {/* PDF canvas — scrollable */}
//       <div className="flex-1 overflow-auto flex items-start justify-center py-6 px-4">
//         <Document
//           file={url}
//           onLoadSuccess={onLoadSuccess}
//           loading={
//             <div className="flex items-center justify-center h-64 w-full">
//               <span className="text-[12px] text-white/25 animate-pulse">Loading PDF…</span>
//             </div>
//           }
//           error={
//             <div className="flex items-center justify-center h-64 w-full">
//               <span className="text-[12px] text-red-400/60">Failed to load PDF.</span>
//             </div>
//           }
//         >
//           <Page
//             pageNumber={pageNumber}
//             // Fill the available width minus padding
//             width={Math.min(window?.innerWidth * 0.45, 680)}
//             renderTextLayer
//             renderAnnotationLayer
//             className="shadow-2xl shadow-black/60 rounded-sm"
//           />
//         </Document>
//       </div>

//       {/* Page controls */}
//       {numPages > 0 && (
//         <div className="flex items-center justify-center gap-3 py-3 border-t border-white/6">
//           <button
//             onClick={prev}
//             disabled={pageNumber <= 1}
//             className={cn(
//               "flex items-center justify-center h-7 w-7 rounded-lg transition-colors",
//               pageNumber <= 1
//                 ? "text-white/15 cursor-not-allowed"
//                 : "text-white/40 hover:text-white/80 hover:bg-white/6",
//             )}
//           >
//             <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
//           </button>

//           <span className="text-[12px] text-white/35 tabular-nums">
//             {pageNumber} / {numPages}
//           </span>

//           <button
//             onClick={next}
//             disabled={pageNumber >= numPages}
//             className={cn(
//               "flex items-center justify-center h-7 w-7 rounded-lg transition-colors",
//               pageNumber >= numPages
//                 ? "text-white/15 cursor-not-allowed"
//                 : "text-white/40 hover:text-white/80 hover:bg-white/6",
//             )}
//           >
//             <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

import { PDFViewer } from '@embedpdf/react-pdf-viewer';
 
export function PdfViewer({ url }: PdfViewerProps) {
    return (
      <div className="flex flex-col h-full border-r border-white/6">
        <PDFViewer
          config={{
            src: url,
            theme: {
              preference: "dark",
              dark: {
                accent: {
                  primary: "#ffffff",
                  primaryHover: "rgba(255,255,255,0.85)",
                  primaryActive: "rgba(255,255,255,0.7)",
                  primaryLight: "rgba(255,255,255,0.06)",
                  primaryForeground: "#0e0e10",
                },
                background: {
                  app:     "#0e0e10",   // matches your sidebar + page bg
                  surface: "#141416",   // matches your card/input bg
                },
              },
            },
            // Disable features you don't need yet
            disabledCategories: ["annotation", "redaction", "export"],
          }}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    )
  }