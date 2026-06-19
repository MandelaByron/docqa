export const queryKeys = {
    chats: {
      all: ["chats"] as const,
      detail: (chatId: string) => ["chats", chatId] as const,
      messages: (chatId: string) => ["chats", chatId, "messages"] as const,
    },
    workspaces: {
      all: ["workspaces"] as const,
      detail: (workspaceId: string) => ["workspaces", workspaceId] as const,
    },
    user: {
      me: ["user", "me"] as const,
    },
  }