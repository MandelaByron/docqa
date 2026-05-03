import json
import traceback
import uuid
from typing import Any, Callable, Dict, Mapping, Sequence

import anthropic
from fastapi.responses import StreamingResponse


def stream_text(
    client: anthropic.Anthropic,
    messages: Sequence[Dict[str, Any]],
    protocol: str = "data",
):
    """Yield Server-Sent Events for a streaming chat completion."""
    try:
        def format_sse(payload: dict) -> str:
            return f"data: {json.dumps(payload, separators=(',', ':'))}\n\n"

        message_id = f"msg-{uuid.uuid4().hex}"
        text_stream_id = "text-1"
        text_started = False
        text_finished = False
        finish_reason = None
        usage_data = None

        yield format_sse({"type": "start", "messageId": message_id})


        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=messages,
        ) as stream:
            current_tool_call_id: str | None = None
            current_tool_name: str | None = None
            current_tool_arguments = ""
            tool_started = False

            for event in stream:
                event_type = event.type

                if event_type == "content_block_start":
                    block = event.content_block
                    if block.type == "text":
                        if not text_started:
                            yield format_sse({"type": "text-start", "id": text_stream_id})
                            text_started = True
                    elif block.type == "tool_use":
                        current_tool_call_id = block.id
                        current_tool_name = block.name
                        current_tool_arguments = ""
                        tool_started = False
                        yield format_sse({
                            "type": "tool-input-start",
                            "toolCallId": current_tool_call_id,
                            "toolName": current_tool_name,
                        })
                        tool_started = True

                elif event_type == "content_block_delta":
                    delta = event.delta
                    if delta.type == "text_delta":
                        yield format_sse({
                            "type": "text-delta",
                            "id": text_stream_id,
                            "delta": delta.text,
                        })
                    elif delta.type == "input_json_delta":
                        current_tool_arguments += delta.partial_json
                        if current_tool_call_id:
                            yield format_sse({
                                "type": "tool-input-delta",
                                "toolCallId": current_tool_call_id,
                                "inputTextDelta": delta.partial_json,
                            })

                elif event_type == "content_block_stop":
                    # If we just finished a tool_use block, execute the tool
                    if current_tool_call_id and current_tool_name and tool_started:
                        raw_arguments = current_tool_arguments
                        try:
                            parsed_arguments = json.loads(raw_arguments) if raw_arguments else {}
                        except Exception as error:
                            yield format_sse({
                                "type": "tool-input-error",
                                "toolCallId": current_tool_call_id,
                                "toolName": current_tool_name,
                                "input": raw_arguments,
                                "errorText": str(error),
                            })
                            current_tool_call_id = None
                            current_tool_name = None
                            tool_started = False
                            continue

                        yield format_sse({
                            "type": "tool-input-available",
                            "toolCallId": current_tool_call_id,
                            "toolName": current_tool_name,
                            "input": parsed_arguments,
                        })

                        tool_function = available_tools.get(current_tool_name)
                        if tool_function is None:
                            yield format_sse({
                                "type": "tool-output-error",
                                "toolCallId": current_tool_call_id,
                                "errorText": f"Tool '{current_tool_name}' not found.",
                            })
                        else:
                            try:
                                tool_result = tool_function(**parsed_arguments)
                            except Exception as error:
                                yield format_sse({
                                    "type": "tool-output-error",
                                    "toolCallId": current_tool_call_id,
                                    "errorText": str(error),
                                })
                            else:
                                yield format_sse({
                                    "type": "tool-output-available",
                                    "toolCallId": current_tool_call_id,
                                    "output": tool_result,
                                })

                        current_tool_call_id = None
                        current_tool_name = None
                        current_tool_arguments = ""
                        tool_started = False

                elif event_type == "message_delta":
                    if hasattr(event, "delta") and hasattr(event.delta, "stop_reason"):
                        finish_reason = event.delta.stop_reason
                    if hasattr(event, "usage"):
                        usage_data = event.usage

                elif event_type == "message_stop":
                    pass  # Final cleanup handled below

        if text_started and not text_finished:
            yield format_sse({"type": "text-end", "id": text_stream_id})
            text_finished = True

        # Map Anthropic stop reasons to OpenAI-style finish reasons
        reason_map = {
            "end_turn": "stop",
            "tool_use": "tool-calls",
            "max_tokens": "length",
            "stop_sequence": "stop",
        }
        mapped_reason = reason_map.get(finish_reason, finish_reason) if finish_reason else None

        finish_metadata: Dict[str, Any] = {}
        if mapped_reason:
            finish_metadata["finishReason"] = mapped_reason

        if usage_data is not None:
            usage_payload = {
                "promptTokens": getattr(usage_data, "input_tokens", None),
                "completionTokens": getattr(usage_data, "output_tokens", None),
            }
            input_tokens = getattr(usage_data, "input_tokens", None)
            output_tokens = getattr(usage_data, "output_tokens", None)
            if input_tokens is not None and output_tokens is not None:
                usage_payload["totalTokens"] = input_tokens + output_tokens
            finish_metadata["usage"] = usage_payload

        if finish_metadata:
            yield format_sse({"type": "finish", "messageMetadata": finish_metadata})
        else:
            yield format_sse({"type": "finish"})

        yield "data: [DONE]\n\n"
    except Exception:
        traceback.print_exc()
        raise


def patch_response_with_headers(
    response: StreamingResponse,
    protocol: str = "data",
) -> StreamingResponse:
    """Apply the standard streaming headers expected by the Vercel AI SDK."""

    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"

    if protocol:
        response.headers.setdefault("x-vercel-ai-protocol", protocol)

    return response