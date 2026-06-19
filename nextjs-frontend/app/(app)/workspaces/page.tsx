
import Link from "next/link"
import { FolderOpen, Plus, FileText } from "lucide-react"
import { loadWorkspaces } from "@/util/workspace-store"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"



export default async function WorkspacesPage() {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) redirect("/")

  const workspaces = await loadWorkspaces(token)
  return (
    <main className="flex flex-col flex-1 px-6 py-8 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold text-white/90 tracking-tight">
            Workspaces
          </h1>
          <p className="text-[13px] text-white/35 mt-0.5">
            Group documents and chat across collections
          </p>
        </div>

        <button className="flex items-center gap-2 h-8 px-3 rounded-lg text-[12.5px] font-medium bg-white/[0.07] text-white/60 hover:bg-white/[0.1] hover:text-white/90 border border-white/[0.08] transition-all duration-150">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New workspace
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/workspaces/${ws.id}`}
            className="group flex flex-col gap-4 p-4 rounded-xl border border-white/[0.07] bg-[#141416] hover:border-white/[0.14] hover:bg-white/[0.03] transition-all duration-150"
          >
            {/* Icon + name */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.05] border border-white/[0.07] shrink-0 mt-0.5">
                <FolderOpen className="h-4 w-4 text-white/35" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-white/85 truncate leading-tight">
                  {ws.name}
                </p>
                {ws.is_personal && (
                  <span className="text-[10.5px] text-white/25 mt-0.5 block">Personal</span>
                )}
              </div>
            </div>

            {/* Doc count */}
            <div className="flex items-center gap-1.5 text-white/25">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.7} />
              <span className="text-[11.5px]">
                {ws.doc_count} {ws.doc_count === 1 ? "document" : "documents"}
              </span>
            </div>
          </Link>
        ))}

        {/* New workspace card */}
        <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02] transition-all duration-150 min-h-[100px]">
          <Plus className="h-5 w-5 text-white/20" strokeWidth={1.5} />
          <span className="text-[12px] text-white/25">New workspace</span>
        </button>
      </div>

    </main>
  )
}