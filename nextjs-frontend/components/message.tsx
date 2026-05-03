
"use client";

import type { UIMessage } from "@ai-sdk/react";
import { motion } from "motion/react"
import { Streamdown } from "streamdown";

import { SparklesIcon } from "lucide-react";

import { PreviewAttachment } from "./preview-attachment";

import { cn } from "@/lib/utils";

export const PreviewMessage = ({
  message,
}: {
  chatId: string;
  message: UIMessage;
  isLoading: boolean;
}) => {
  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          "group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl"
        )}
      >
        {message.role === "assistant" && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          {message.parts &&
            message.parts.map((part: any, index: number) => {
              if (part.type === "text") {
                return (
                  <div key={index} className="flex flex-col gap-4">
                    <Streamdown>{part.text}</Streamdown>
                  </div>
                );
              }
              // Handle tool calls - type is "tool-{toolName}" in AI SDK v5
              if (part.type?.startsWith("tool-")) {
                const { toolCallId, state, output } = part;
                const toolName = part.type.replace("tool-", "");

                if (state === "output-available" && output) {
                  return (
                    <div key={toolCallId}>
                      {toolName === "get_current_weather" ? (
                        <span>Tool Call</span>
                      ) : (
                        <pre>{JSON.stringify(output, null, 2)}</pre>
                      )}
                    </div>
                  );
                }
                // Show loading state while tool is executing
                if (
                  state === "input-streaming" ||
                  state === "input-available"
                ) {
                  return (
                    <div
                      key={toolCallId}
                      className={cn({
                        skeleton: ["get_current_weather"].includes(toolName),
                      })}
                    >
                      {toolName === "get_current_weather" ? <span>Tool Called</span> : null}
                    </div>
                  );
                }
              }
              if (part.type === "file") {
                return (
                  <PreviewAttachment
                    key={index}
                    attachment={part}
                  />
                );
              }
              return null;
            })}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
      data-role="assistant"
    >
      <div className="flex gap-4 rounded-xl">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex items-center gap-1.5 h-8">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block size-1.5 rounded-full bg-muted-foreground/50"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};