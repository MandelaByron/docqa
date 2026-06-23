import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useApiClient } from "@/hooks/use-api-client"
import { queryKeys } from "@/lib/query-keys"
import { ChatRead, WorkspaceRead } from "@/lib/types"
import { useRouter } from "next/navigation"

export function useWorkspaces(enabled = false) {
  const api = useApiClient()

  return useQuery<WorkspaceRead[]>({
    queryKey: queryKeys.workspaces.all,
    queryFn: () => api.get<WorkspaceRead[]>("/workspaces"),
    enabled,
  })
}

export function useWorkspaceDelete() {
  const api = useApiClient()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (workspaceId: string) => api.delete(`/workspaces/${workspaceId}`),
    onSuccess: (_data, workspaceId) => {
      // Remove from list cache immediately — no refetch needed
      queryClient.setQueryData<WorkspaceRead[]>(queryKeys.workspaces.all, (old) =>
        old?.filter((w) => w.id !== workspaceId) ?? []
      )
      // Drop the detail cache for this workspace
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) })
      router.push("/workspaces")
    },
  })

}

export function useWorkspaceRename() {
  const api = useApiClient()
  const queryClient = useQueryClient()
 
  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      api.patch<WorkspaceRead>(`/workspaces/${workspaceId}`, { name }),
    onSuccess: (updated) => {
      // Update the name in the list cache
      queryClient.setQueryData<WorkspaceRead[]>(queryKeys.workspaces.all, (old) =>
        old?.map((w) => (w.id === updated.id ? { ...w, name: updated.name } : w)) ?? []
      )
      // Update the detail cache if it exists
      queryClient.setQueryData<WorkspaceRead>(
        queryKeys.workspaces.detail(updated.id),
        (old) => (old ? { ...old, name: updated.name } : old)
      )
    },
  })
}

export function useWorkspace(workspaceId: string, initialData?: WorkspaceRead) {
  const api = useApiClient()

  return useQuery<WorkspaceRead>({
    queryKey: queryKeys.workspaces.detail(workspaceId),
    queryFn: () => api.get<WorkspaceRead>(`/workspaces/${workspaceId}`),
    initialData,
  })
}

export function useAddChatToWorkspace() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workspaceId,
      chatId,
    }: {
      workspaceId: string
      chatId: string
      chat: ChatRead
    }) => api.post(`/workspaces/${workspaceId}/chats`, { chat_id: chatId }),
    onMutate: async ({ workspaceId, chat }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.workspaces.detail(workspaceId),
      })
    
      const previous = queryClient.getQueryData<WorkspaceRead>(
        queryKeys.workspaces.detail(workspaceId),
      )
    
      // Optimistically update the detail cache
      if (previous && !previous.chats.some((c) => c.id === chat.id)) {
        queryClient.setQueryData<WorkspaceRead>(
          queryKeys.workspaces.detail(workspaceId),
          { ...previous, chats: [...previous.chats, chat] },
        )
      }
    
      // ← ADD THIS: optimistically increment chat_count in the list cache
      const previousList = queryClient.getQueryData<WorkspaceRead[]>(queryKeys.workspaces.all)
      queryClient.setQueryData<WorkspaceRead[]>(queryKeys.workspaces.all, (old) =>
        old?.map((w) =>
          w.id === workspaceId
            ? { ...w, chat_count: (w.chat_count ?? 0) + 1 }
            : w
        ) ?? []
      )
    
      return { previous, previousList }  // ← ADD previousList to the return
    },

    onError: (_err, { workspaceId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.workspaces.detail(workspaceId),
          context.previous,
        )
      }
      // ← ADD THIS: roll back the list cache on failure
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.workspaces.all, context.previousList)
      }
    },
    onSettled: (_data, _err, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.detail(workspaceId),
      })
      // ← ADD THIS: refetch the list so chat_count is accurate from the server
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.all,
      })
    },
  })
}



export function useCreateWorkspace() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      name,
      isPersonal = false,
    }: {
      name: string
      isPersonal?: boolean
    }) =>
      api.post<WorkspaceRead>("/workspaces", {
        name,
        is_personal: isPersonal,
      }),
    onSuccess: (newWorkspace) => {
      // Same pattern as useCreateChat — prepend to the cached list
      // so the new workspace appears instantly without a refetch.
      queryClient.setQueryData<WorkspaceRead[]>(queryKeys.workspaces.all, (old) => {
        const list = old ?? []
        if (list.some((w) => w.id === newWorkspace.id)) return list
        return [newWorkspace, ...list]
      })
    },
  })
}