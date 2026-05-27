'use client';

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { type UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider, useAssistantRuntime, useAui } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
//import { AssistantRuntimeProvider, useAssistantRuntime } from "@assistant-ui/react"



interface ChatProps {
  chatId: string
  initialMessages?: UIMessage[]
  injectedPrompt?: string
  onInjectedPromptConsumed?: () => void
}

function PromptInjector({
  injectedPrompt,
  onInjectedPromptConsumed,
}: {
  injectedPrompt?: string
  onInjectedPromptConsumed?: () => void
}) {
  const aui = useAui()

  useEffect(() => {
    if (!injectedPrompt) return

    aui.composer().setText(injectedPrompt)
    aui.composer().send()

    onInjectedPromptConsumed?.()
  }, [injectedPrompt])

  return null
}

export function Chat({ chatId, initialMessages, injectedPrompt, onInjectedPromptConsumed }: ChatProps) {
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
          },
        };
      },


    }),
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <PromptInjector
        injectedPrompt={injectedPrompt}
        onInjectedPromptConsumed={onInjectedPromptConsumed}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  )
}