
#from app.api.deps import 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from fastapi import status, HTTPException
from pydantic_ai.messages import ModelMessagesTypeAdapter, UserPromptPart
from pydantic_core import to_jsonable_python
from collections.abc import Sequence

from pydantic_ai import (
    ModelMessage, 
    ModelMessagesTypeAdapter
) 
import json

from app.models import User, Message, MessageRole, MessageStatus
from pydantic_ai.ui.vercel_ai._adapter import VercelAIAdapter
from pydantic_ai import (
    ModelRequest,
    ModelResponse,
    UserPromptPart,
    
    ToolReturnPart,
    ToolCallPart,
    TextPart

)
from uuid import UUID, uuid4

async def get_messages(session: AsyncSession, chat_id: UUID):
    
    result = await session.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )

    rows = result.scalars().all()

    #json_rows = to_jsonable_python(rows)
    #print(rows)
    messages: list[ModelMessage] = []
    for row in rows:
        # row.pydantic_ai_message is already deserialized JSONB
        # (SQLAlchemy auto-parses JSONB columns into dicts)
        #print(row)
        messages.extend(
            ModelMessagesTypeAdapter.validate_python([row.pydantic_ai_message])
        )
    #print(messages)
    return messages



async def add_messages(
    *,
    db: AsyncSession,
    chat_id: UUID,
    user_id: UUID | None,
    new_messages: bytes,
    save_user_messages: bool = True,
) -> list[Message]:
    """
    Persist newly generated PydanticAI messages.

    Stores:
    - visible chat messages -> Message
    - internal tool events -> MessageEvent
    """

    parsed_messages = ModelMessagesTypeAdapter.validate_json(
        new_messages
    )


    persisted_messages: list[Message] = []

    for message in parsed_messages:
        print(" parsed messages in crud--- ",message, "\n")

        #as_python_objects = to_jsonable_python(message)  
        #print(as_python_objects)
        #print(message, "\n")
        pydantic_ai_message_json = ModelMessagesTypeAdapter.dump_json(
            [message]
        )
        pydantic_ai_message = json.loads(pydantic_ai_message_json)[0]


        if isinstance(message, ModelRequest):
            if not save_user_messages:
                continue  # skip entirely when called from on_complete
            for part in message.parts:

                if isinstance(part, UserPromptPart):
                    print(part.timestamp)
                    ui_message = {
                        "role": "user",
                        "id": str(uuid4()),
                        "parts": [
                            {
                                "type": "text",
                                "text": part.content,
                            }
                        ]
                    }
                    db_message = Message(
                        chat_id=chat_id,
                        user_id=user_id,
                        role=MessageRole.USER,
                        status=MessageStatus.COMPLETED,

                        content=part.content,
                        pydantic_ai_message=pydantic_ai_message,

                        ui_message= ui_message
                    )

                    db.add(db_message)

                    persisted_messages.append(db_message)

                # -------------------------------------------------
                # TOOL RESULT
                # -------------------------------------------------

                # elif isinstance(part, ToolReturnPart):

                #     event = MessageEvent(
                #         message_id=parent_message_id,

                #         event_type="tool_result",

                #         payload={
                #             "tool_name": part.tool_name,
                #             "tool_call_id": part.tool_call_id,
                #             "content": part.content,
                #             "timestamp": (
                #                 part.timestamp.isoformat()
                #                 if part.timestamp
                #                 else None
                #             ),
                #         },
                #     )

                #     db.add(event)


        elif isinstance(message, ModelResponse):

            usage = message.usage

            prompt_tokens = None
            completion_tokens = None
            total_tokens = None

            if usage:
                prompt_tokens = usage.input_tokens
                completion_tokens = usage.output_tokens

                if (
                    prompt_tokens is not None
                    and completion_tokens is not None
                ):
                    total_tokens = (
                        prompt_tokens + completion_tokens
                    )

            for part in message.parts:

                # -------------------------------------------------
                # ASSISTANT TEXT RESPONSE
                # -------------------------------------------------

                if isinstance(part, TextPart):
                    ui_message = {
                        "id": str(uuid4()),
                        "role": "assistant",
                        "parts": [
                            {
                                "type": "text",
                                "text": part.content,
                            }
                        ]
                    }

                    db_message = Message(
                        chat_id=chat_id,
                        role=MessageRole.ASSISTANT,
                        status=MessageStatus.COMPLETED,

                        content=part.content,
                        pydantic_ai_message=pydantic_ai_message,
                        ui_message=ui_message,

                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                    )

                    db.add(db_message)

                    persisted_messages.append(db_message)

                # -------------------------------------------------
                # TOOL CALL
                # -------------------------------------------------

                # elif isinstance(part, ToolCallPart):

                #     event = MessageEvent(
                #         message_id=parent_message_id,

                #         event_type="tool_call",

                #         payload={
                #             "tool_name": part.tool_name,
                #             "tool_call_id": part.tool_call_id,
                #             "args": part.args,
                #         },
                #     )

                #     db.add(event)


    await db.commit()
    return persisted_messages

