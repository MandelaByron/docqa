import json
from enum import Enum
from typing import Any, List, Optional, Dict

from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel, ConfigDict

from .attachment import ClientAttachment




class ToolInvocationState(str, Enum):
    CALL = 'call'
    PARTIAL_CALL = 'partial-call'
    RESULT = 'result'

class ToolInvocation(BaseModel):
    state: ToolInvocationState
    toolCallId: str
    toolName: str
    args: Any
    result: Any


class ClientMessagePart(BaseModel):
    type: str
    text: Optional[str] = None
    contentType: Optional[str] = None
    url: Optional[str] = None
    data: Optional[Any] = None
    toolCallId: Optional[str] = None
    toolName: Optional[str] = None
    state: Optional[str] = None
    input: Optional[Any] = None
    output: Optional[Any] = None
    args: Optional[Any] = None

    model_config = ConfigDict(extra="allow")


class ClientMessage(BaseModel):
    role: str
    content: Optional[str] = None
    parts: Optional[List[ClientMessagePart]] = None
    experimental_attachments: Optional[List[ClientAttachment]] = None
    toolInvocations: Optional[List[ToolInvocation]] = None

class Request(BaseModel):
    messages: List[ClientMessage]


def convert_to_anthropic_messages(messages: List[ClientMessage]) -> List[Dict[str, Any]]:
    anthropic_messages = []

    for message in messages:
        content_blocks: List[Dict[str, Any]] = []
        tool_use_blocks: List[Dict[str, Any]] = []
        tool_result_blocks: List[Dict[str, Any]] = []

        if message.parts:
            for part in message.parts:
                if part.type == 'text':
                    content_blocks.append({
                        'type': 'text',
                        'text': part.text or ''
                    })

                elif part.type == 'file':
                    if part.contentType and part.contentType.startswith('image') and part.url:
                        # Anthropic expects base64 images or image URLs via the image block type
                        content_blocks.append({
                            'type': 'image',
                            'source': {
                                'type': 'url',
                                'url': part.url,
                            }
                        })
                    elif part.url:
                        # Fall back to text for non-image files
                        content_blocks.append({
                            'type': 'text',
                            'text': part.url
                        })

                elif part.type.startswith('tool-'):
                    tool_call_id = part.toolCallId
                    tool_name = part.toolName or part.type.replace('tool-', '', 1)

                    if tool_call_id and tool_name:
                        should_emit_tool_use = False

                        if part.state and any(keyword in part.state for keyword in ('call', 'input')):
                            should_emit_tool_use = True

                        if part.input is not None or part.args is not None:
                            should_emit_tool_use = True

                        if should_emit_tool_use:
                            arguments = part.input if part.input is not None else part.args
                            if isinstance(arguments, str):
                                try:
                                    parsed_input = json.loads(arguments)
                                except Exception:
                                    parsed_input = {"raw": arguments}
                            else:
                                parsed_input = arguments or {}

                            # Anthropic tool_use blocks go in the assistant message content
                            tool_use_blocks.append({
                                'type': 'tool_use',
                                'id': tool_call_id,
                                'name': tool_name,
                                'input': parsed_input,
                            })

                        if part.state == 'output-available' and part.output is not None:
                            # Anthropic tool results are user-role messages
                            tool_result_blocks.append({
                                'type': 'tool_result',
                                'tool_use_id': tool_call_id,
                                'content': json.dumps(part.output),
                            })

        elif message.content is not None:
            content_blocks.append({
                'type': 'text',
                'text': message.content
            })

        if not message.parts and message.experimental_attachments:
            for attachment in message.experimental_attachments:
                if attachment.contentType.startswith('image'):
                    content_blocks.append({
                        'type': 'image',
                        'source': {
                            'type': 'url',
                            'url': attachment.url,
                        }
                    })
                elif attachment.contentType.startswith('text'):
                    content_blocks.append({
                        'type': 'text',
                        'text': attachment.url
                    })

        if message.toolInvocations:
            for invocation in message.toolInvocations:
                arguments = invocation.args
                parsed_input = arguments if isinstance(arguments, dict) else json.loads(arguments or '{}')

                tool_use_blocks.append({
                    'type': 'tool_use',
                    'id': invocation.toolCallId,
                    'name': invocation.toolName,
                    'input': parsed_input,
                })

        # Build the assistant message — Anthropic requires tool_use blocks
        # to be in the same content array as any text in the assistant turn.
        role = message.role  # "user" or "assistant"

        if role == "assistant":
            combined_content = content_blocks + tool_use_blocks
            anthropic_messages.append({
                "role": "assistant",
                "content": combined_content if combined_content else [{"type": "text", "text": ""}],
            })
        else:
            if content_blocks:
                payload = content_blocks[0]["text"] if (
                    len(content_blocks) == 1 and content_blocks[0]["type"] == "text"
                ) else content_blocks
                anthropic_messages.append({
                    "role": "user",
                    "content": payload,
                })

        # Tool results must follow as a separate user-role message
        if message.toolInvocations:
            result_blocks = [
                {
                    'type': 'tool_result',
                    'tool_use_id': invocation.toolCallId,
                    'content': json.dumps(invocation.result),
                }
                for invocation in message.toolInvocations
            ]
            anthropic_messages.append({
                "role": "user",
                "content": result_blocks,
            })

        if tool_result_blocks:
            anthropic_messages.append({
                "role": "user",
                "content": tool_result_blocks,
            })

    return anthropic_messages
def convert_to_openai_messages(messages: List[ClientMessage]) -> List[ChatCompletionMessageParam]:
    openai_messages = []

    for message in messages:
        message_parts: List[dict] = []
        tool_calls = []
        tool_result_messages = []

        if message.parts:
            for part in message.parts:
                if part.type == 'text':
                    # Ensure empty strings default to ''
                    message_parts.append({
                        'type': 'text',
                        'text': part.text or ''
                    })

                elif part.type == 'file':
                    if part.contentType and part.contentType.startswith('image') and part.url:
                        message_parts.append({
                            'type': 'image_url',
                            'image_url': {
                                'url': part.url
                            }
                        })
                    elif part.url:
                        # Fall back to including the URL as text if we cannot map the file directly.
                        message_parts.append({
                            'type': 'text',
                            'text': part.url
                        })

                elif part.type.startswith('tool-'):
                    tool_call_id = part.toolCallId
                    tool_name = part.toolName or part.type.replace('tool-', '', 1)

                    if tool_call_id and tool_name:
                        should_emit_tool_call = False

                        if part.state and any(keyword in part.state for keyword in ('call', 'input')):
                            should_emit_tool_call = True

                        if part.input is not None or part.args is not None:
                            should_emit_tool_call = True

                        if should_emit_tool_call:
                            arguments = part.input if part.input is not None else part.args
                            if isinstance(arguments, str):
                                serialized_arguments = arguments
                            else:
                                serialized_arguments = json.dumps(arguments or {})

                            tool_calls.append({
                                "id": tool_call_id,
                                "type": "function",
                                "function": {
                                    "name": tool_name,
                                    "arguments": serialized_arguments
                                }
                            })

                        if part.state == 'output-available' and part.output is not None:
                            tool_result_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call_id,
                                "content": json.dumps(part.output),
                            })

        elif message.content is not None:
            message_parts.append({
                'type': 'text',
                'text': message.content
            })

        if not message.parts and message.experimental_attachments:
            for attachment in message.experimental_attachments:
                if attachment.contentType.startswith('image'):
                    message_parts.append({
                        'type': 'image_url',
                        'image_url': {
                            'url': attachment.url
                        }
                    })

                elif attachment.contentType.startswith('text'):
                    message_parts.append({
                        'type': 'text',
                        'text': attachment.url
                    })

        if(message.toolInvocations):
            for toolInvocation in message.toolInvocations:
                tool_calls.append({
                    "id": toolInvocation.toolCallId,
                    "type": "function",
                    "function": {
                        "name": toolInvocation.toolName,
                        "arguments": json.dumps(toolInvocation.args)
                    }
                })

        if message_parts:
            if len(message_parts) == 1 and message_parts[0]['type'] == 'text':
                content_payload = message_parts[0]['text']
            else:
                content_payload = message_parts
        else:
            # Ensure that we always provide some content for OpenAI
            content_payload = ""

        openai_message: ChatCompletionMessageParam = {
            "role": message.role,
            "content": content_payload,
        }

        if tool_calls:
            openai_message["tool_calls"] = tool_calls

        openai_messages.append(openai_message)

        if(message.toolInvocations):
            for toolInvocation in message.toolInvocations:
                tool_message = {
                    "role": "tool",
                    "tool_call_id": toolInvocation.toolCallId,
                    "content": json.dumps(toolInvocation.result),
                }

                openai_messages.append(tool_message)

        openai_messages.extend(tool_result_messages)

    return openai_messages
