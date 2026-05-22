"use client"

import { useState, useRef, useCallback } from "react"
import type { UploadStage } from "./types"

// ─── useFileProcessor ─────────────────────────────────────────────────────────
// Owns upload + processing state.
// Swap the body of `simulate` for real FastAPI calls when ready.

export function useFileProcessor() {
  const [stage,      setStage]      = useState<UploadStage>("idle")
  const [progress,   setProgress]   = useState(0)   // 0–100
  const [statusText, setStatusText] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const simulate = useCallback((onDone: () => void, shouldFail = false) => {
    clearTimer()
    setProgress(0)

    // Stage 1 — uploading
    setStage("uploading")
    setStatusText("Uploading file…")

    let pct = 0
    const uploadTick = setInterval(() => {
      pct += Math.random() * 18 + 8        // uneven increments feel like real I/O
      if (pct >= 100) {
        pct = 100
        clearInterval(uploadTick)
        setProgress(100)

        // Stage 2 — processing (or error)
        timerRef.current = setTimeout(() => {
          if (shouldFail) {
            setStage("error")
            setStatusText("Something went wrong. Please try again.")
            return
          }

          setStage("processing")
          setStatusText("Indexing document…")
          setProgress(0)

          let p2 = 0
          const processTick = setInterval(() => {
            p2 += Math.random() * 12 + 4
            if (p2 >= 100) {
              p2 = 100
              clearInterval(processTick)
              setProgress(100)

              // Stage 3 — done
              timerRef.current = setTimeout(() => {
                setStage("done")
                setStatusText("Ready")
                onDone()
              }, 400)
            } else {
              setProgress(Math.min(p2, 99))
            }
          }, 180)
        }, 500)
      } else {
        setProgress(Math.min(pct, 99))
      }
    }, 120)
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    setStage("idle")
    setProgress(0)
    setStatusText("")
  }, [])

  return { stage, progress, statusText, simulate, reset }
}