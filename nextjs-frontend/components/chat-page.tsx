'use client';

import { useChat } from "@ai-sdk/react";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { type UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
//import {useChatR}
import { useDataStreamRuntime } from "@assistant-ui/react-data-stream";
import { AssistantRuntimeProvider, ThreadMessageLike } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";

import { saveChat } from "@/util/chat-store";

interface ChatProps {
  chatId: string
  initialMessages?: UIMessage[]
}

export function Chat({ chatId, initialMessages }: ChatProps) {
  const { getToken } = useAuth()

  const runtime = useChatRuntime({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/ai/ask/${chatId}`,
      headers: async () => ({
        Authorization: `Bearer ${await getToken()}`,
        //Accept: "text/event-stream"
      }),
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            id,
            messages,
            trigger: "submit-message",
            metadata: {},
            config: {
              modelName: "gpt-4o",
            },
          },
        };
      },


    }),
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>

        <div className="flex flex-1 flex-col min-h-0">
          <Thread />
        </div>
    </AssistantRuntimeProvider>
  )
}