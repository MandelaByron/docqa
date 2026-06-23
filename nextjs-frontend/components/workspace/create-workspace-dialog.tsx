"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCreateWorkspace } from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/api-client"

// ─── Trigger variants ───────────────────────────────────────────────────────
// Both the header button and the dashed grid card open the same dialog.
// "variant" controls which trigger style renders.

interface CreateWorkspaceDialogProps {
  variant?: "button" | "card"
}

export function CreateWorkspaceDialog({ variant = "button" }: CreateWorkspaceDialogProps) {
  const router = useRouter()
  const createWorkspace = useCreateWorkspace()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    try {
      const workspace = await createWorkspace.mutateAsync({ name: trimmed })
      setOpen(false)
      setName("")
      router.push(`/workspaces/${workspace.id}`)
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Could not create workspace."
      toast.error("Error", { description: message, position: "top-right" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "button" ? (
          <button className="flex items-center gap-2 h-8 px-3 rounded-lg text-[12.5px] font-medium bg-white/[0.07] text-white/60 hover:bg-white/[0.1] hover:text-white/90 border border-white/[0.08] transition-all duration-150">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New workspace
          </button>
        ) : (
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02] transition-all duration-150 min-h-[100px]">
            <Plus className="h-5 w-5 text-white/20" strokeWidth={1.5} />
            <span className="text-[12px] text-white/25">New workspace</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-[#141416] border border-white/[0.08] rounded-xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white/90 text-[15px] font-semibold">
            New workspace
          </DialogTitle>
          <DialogDescription className="text-white/40 text-[13px]">
            Group related documents and chat across all of them at once.
          </DialogDescription>
        </DialogHeader>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
          }}
          placeholder="Workspace name"
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13.5px] text-white/90 placeholder:text-white/25 outline-none focus:border-white/[0.18] transition-colors"
        />

        <DialogFooter className="gap-2 mt-1">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 h-8 text-[12.5px] bg-transparent border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.05] hover:border-white/[0.14] rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || createWorkspace.isPending}
            className="flex-1 h-8 text-[12.5px] bg-white/[0.1] text-white/90 hover:bg-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            {createWorkspace.isPending ? "Creating…" : "Create"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}