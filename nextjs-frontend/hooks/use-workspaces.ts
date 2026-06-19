import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useApiClient } from "@/hooks/use-api-client"
import { queryKeys } from "@/lib/query-keys"
import { ChatRead, WorkspaceRead } from "@/lib/types"

export function useWorkspaces(enabled = false) {
  const api = useApiClient()

  return useQuery<WorkspaceRead[]>({
    queryKey: queryKeys.workspaces.all,
    queryFn: () => api.get<WorkspaceRead[]>("/workspaces"),
    enabled,
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

      if (previous && !previous.chats.some((c) => c.id === chat.id)) {
        queryClient.setQueryData<WorkspaceRead>(
          queryKeys.workspaces.detail(workspaceId),
          {
            ...previous,
            chats: [...previous.chats, chat],
          },
        )
      }

      return { previous }
    },
    onError: (_err, { workspaceId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.workspaces.detail(workspaceId),
          context.previous,
        )
      }
    },
    onSettled: (_data, _err, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.detail(workspaceId),
      })
    },
  })
}
