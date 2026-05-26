
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ─── Delete confirmation dialog ───────────────────────────────────────────────
 
interface DeleteDialogProps {
    open: boolean
    chatTitle: string
    onConfirm: () => void
    onCancel: () => void
  }
   
export default function DeleteChatDialog({ open, chatTitle, onConfirm, onCancel }: DeleteDialogProps) {
    return (
      <AlertDialog open={open}>
        <AlertDialogContent className="bg-[#141416] border border-white/[0.08] shadow-2xl shadow-black/60 rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white/90 text-[15px] font-semibold">
              Delete chat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-[13px] leading-relaxed">
              <span className="text-white/60 font-medium">"{chatTitle}"</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-1">
            <AlertDialogCancel
              onClick={onCancel}
              className="flex-1 h-8 text-[12.5px] bg-transparent border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.05] hover:border-white/[0.14] rounded-lg transition-all"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="flex-1 h-8 text-[12.5px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition-all"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }