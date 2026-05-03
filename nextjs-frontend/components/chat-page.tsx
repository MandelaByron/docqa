"use client";

import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { useState } from "react";
import { 
  type PromptInputMessage, 
  PromptInput,
  PromptInputHeader,
  usePromptInputAttachments,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSelectItem,
  PromptInputSubmit,
  PromptInputSelectContent

} from "./ai-elements/prompt-input";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "./ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "./ai-elements/message";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import { ThinkingMessage } from "./message";
import { DefaultChatTransport } from "ai";

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};
const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

export function Chat() {
  const chatId = "001";

  const { messages, setMessages, sendMessage, status, stop } = useChat({ id: chatId, transport: new DefaultChatTransport({api: "/api/ai/ask"})});

  const [model, setModel] = useState<string>(models[0].id);
  const [text, setText] = useState<string>("");

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
        },
      }
    );
    setText("");
  };

  const lastMessage = messages[messages.length - 1];
  const showThinking = isLoading && lastMessage?.role === "user";
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg  h-[calc(100dvh-52px)]">
      <div className="flex flex-col h-full">       
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type){
                      case 'text':
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        )
                      default:
                        return null
                    }
                  })}
                </MessageContent>

              </Message>
            ))}
            {showThinking && <ThinkingMessage />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4 border-none" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody className="border-none">
            <PromptInputTextarea onChange={(e) => setText(e.target.value)} value={text} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments label="Upload files" />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputSelect onValueChange={(value) => {setModel(value)}} value={model}>
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputFooter>
        
        </PromptInput>           
      </div>
    </div>

  );
}