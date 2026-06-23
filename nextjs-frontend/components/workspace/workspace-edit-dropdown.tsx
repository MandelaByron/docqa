"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useWorkspaceDelete, useWorkspaceRename } from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/api-client"

interface WorkspaceActionsDropdownProps {
  workspaceId: string
  workspaceName: string
}

export function WorkspaceActionsDropdown({
  workspaceId,
  workspaceName,
}: WorkspaceActionsDropdownProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [nameInput, setNameInput] = useState(workspaceName)

  const deleteWorkspace = useWorkspaceDelete()
  const renameWorkspace = useWorkspaceRename()  

  const handleRename = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === workspaceName) { setRenameOpen(false); return }
    try {
      await renameWorkspace.mutateAsync({ workspaceId, name: trimmed })
      setRenameOpen(false)
      toast.success("Workspace renamed", { position: "top-right" })
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Could not rename workspace."
      toast.error("Error", { description: message, position: "top-right" })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteWorkspace.mutateAsync(workspaceId)
      // router.push("/workspaces") is handled inside useDeleteWorkspace
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "Could not delete workspace."
      toast.error("Error", { description: message, position: "top-right" })
      setDeleteOpen(false)
    }
  }

  return (
    <>
      {/* ── Dropdown trigger ── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.preventDefault()} // prevent Link navigation on the card
          className="flex items-center justify-center h-6 w-6 rounded-lg text-white/0 group-hover:text-white/35 hover:!text-white/70 hover:bg-white/[0.07] transition-all duration-100 outline-none"
        >
          <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-40 bg-[#141416] border border-white/[0.08] rounded-xl p-1 shadow-xl shadow-black/40"
        >
          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); setNameInput(workspaceName); setRenameOpen(true) }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-white/55 hover:text-white/85 hover:bg-white/[0.06] cursor-pointer transition-colors outline-none"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); setDeleteOpen(true) }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] cursor-pointer transition-colors outline-none"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.7} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Rename dialog ── */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="bg-[#141416] border border-white/[0.08] rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white/90 text-[15px] font-semibold">
              Rename workspace
            </DialogTitle>
            <DialogDescription className="text-white/40 text-[13px]">
              Enter a new name for this workspace.
            </DialogDescription>
          </DialogHeader>

          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename() }}
            className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13.5px] text-white/90 placeholder:text-white/25 outline-none focus:border-white/[0.18] transition-colors"
          />

          <DialogFooter className="gap-2 mt-1">
            <button
              onClick={() => setRenameOpen(false)}
              className="flex-1 h-8 text-[12.5px] bg-transparent border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              disabled={!nameInput.trim() || renameWorkspace.isPending}
              className="flex-1 h-8 text-[12.5px] bg-white/[0.1] text-white/90 hover:bg-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
            >
              {renameWorkspace.isPending ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#141416] border border-white/[0.08] rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white/90 text-[15px] font-semibold">
              Delete workspace?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-[13px] leading-relaxed">
              <span className="text-white/60 font-medium">&quot;{workspaceName}&quot;</span> will be
              permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-1">
            <AlertDialogCancel
              onClick={() => setDeleteOpen(false)}
              className="flex-1 h-8 text-[12.5px] bg-transparent border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-all"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteWorkspace.isPending}
              className="flex-1 h-8 text-[12.5px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
            >
              {deleteWorkspace.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}