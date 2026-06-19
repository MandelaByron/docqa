// hooks/use-chats.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useApiClient } from "@/hooks/use-api-client"
import { queryKeys } from "@/lib/query-keys"
import { ChatRead } from "@/lib/types"

export function useChats() {
    const api = useApiClient()
  
    return useQuery<ChatRead[]>({
      queryKey: queryKeys.chats.all,
      queryFn: async () => {
        const res = await api.get<ChatRead[]>("/chats/fetch_chats")
        return res
      },
    })
  }

export function useDeleteChat() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (chatId: string) => api.delete(`/chats/${chatId}`),
    onSuccess: (_data, chatId) => {
      // Optimistically remove from the cached list instead of refetching
      queryClient.setQueryData<ChatRead[]>(queryKeys.chats.all, (old) =>
        old?.filter((c) => c.id !== chatId) ?? []
      )
    },
  })
}