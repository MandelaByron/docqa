
# app/services/storage.py
"""
Local file storage. Swap this module out later for an S3 implementation
without touching any route handlers.
"""
import os
import aiofiles
from uuid import UUID
from fastapi import UploadFile
from app.config import settings

UPLOAD_DIR = settings.upload_dir


async def save_upload(
    file: UploadFile,
    workspace_id: UUID,
    document_id: UUID,
) -> tuple[str, int]:
    """
    Saves an uploaded file to disk.
    Returns (relative_file_path, size_bytes).
    """
    folder = os.path.join(UPLOAD_DIR, str(workspace_id), str(document_id))
    os.makedirs(folder, exist_ok=True)

    file_path = os.path.join(folder, file.filename)
    size = 0

    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):   # 1 MB at a time
            await f.write(chunk)
            size += len(chunk)

    return file_path, size


async def delete_upload(file_path: str) -> None:
    """Removes a file from disk. Silent if already gone."""
    try:
        os.remove(file_path)
    except FileNotFoundError:
        pass