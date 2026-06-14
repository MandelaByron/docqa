//import { WorkspacePage } from "@/components/workspace/workspace-page"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { loadWorkspace } from "@/util/workspace-store"
import { WorkspacePage } from "@/components/workspace/workspace-page"

export default async function WorkspaceDetailPage(
  props: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await props.params
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) redirect("/")

  const workspace = await loadWorkspace(workspaceId, token)
  if (!workspace) redirect("/workspaces")

  return (
    <WorkspacePage
      workspace={workspace}
    />
  )
}