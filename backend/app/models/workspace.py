# from __future__ import annotations

# from typing import List
# from datetime import datetime
# from uuid import UUID, uuid4

# from sqlalchemy import Column, DateTime, String, func
# from sqlmodel import Field, Relationship, SQLModel

# #from app.models.user import User
# #from app.models.workspace_member import WorkspaceMember

# class Workspace(SQLModel, table=True):
#     """Represents an isolated tenant workspace."""

#     __tablename__ = "workspace"

#     id: UUID = Field(default_factory=uuid4, primary_key=True)
#     owner_id: UUID = Field(foreign_key="user.id", nullable=False, index=True)
#     name: str = Field(sa_column=Column(String, nullable=False))
#     plan: str = Field(default="free", nullable=False)
#     doc_count: int = Field(default=0, nullable=False)
#     storage_quota_bytes: int = Field(default=524288000, nullable=False)
#     is_personal: bool = Field(default=True, nullable=False)
#     created_at: datetime = Field(
#         sa_column=Column(
#             DateTime(timezone=True), nullable=False, server_default=func.now()
#         )
#     )
#     updated_at: datetime = Field(
#         sa_column=Column(
#             DateTime(timezone=True),
#             nullable=False,
#             server_default=func.now(),
#             onupdate=func.now(),
#         )
#     )

#     owner: "User" = Relationship(back_populates="workspaces")
#     members: List["WorkspaceMember"] = Relationship(back_populates="workspace")
