import { CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UploadStage } from "./types"

// ─── ProgressBar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number
  stage: UploadStage
}

export function ProgressBar({ progress, stage }: ProgressBarProps) {
  const color =
    stage === "error" ? "bg-red-500" :
    stage === "done"  ? "bg-emerald-500" :
    "bg-white/70"

  return (
    <div className="w-full h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-200 ease-out", color)}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// ─── StageIndicator ───────────────────────────────────────────────────────────

interface StageIndicatorProps {
  stage: UploadStage
  progress: number
  statusText: string
}

export function StageIndicator({ stage, progress, statusText }: StageIndicatorProps) {
  if (stage === "idle") return null

  const icon =
    stage === "done" ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
    ) : stage === "error" ? (
      <AlertCircle className="h-3.5 w-3.5 text-red-400" strokeWidth={2} />
    ) : (
      // uploading / processing — bouncing dots
      <span className="flex gap-[3px] items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-[3px] w-[3px] rounded-full bg-white/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
          />
        ))}
      </span>
    )

  return (
    <div className="mt-3 space-y-2">
      <ProgressBar progress={progress} stage={stage} />
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={cn(
            "text-[11.5px]",
            stage === "done"  ? "text-emerald-400" :
            stage === "error" ? "text-red-400" :
            "text-white/40",
          )}
        >
          {statusText}
          {(stage === "uploading" || stage === "processing") && (
            <span className="ml-1 text-white/25">{Math.round(progress)}%</span>
          )}
        </span>
      </div>
    </div>
  )
}