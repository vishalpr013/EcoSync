"""
File Upload API routes: handles proof/evidence uploads.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import os
import uuid
import shutil

from app.api.deps import get_current_user
from app.models.core import User
from app.core.config import settings

router = APIRouter()

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an evidence file for CSR activities or challenges.
    Saves file locally and returns a public URL path.
    """
    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
        )

    # Check extension / content type (e.g. images, pdf, document formats)
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Extension {ext} is not allowed. Upload PDF, docx, xlsx, or images (jpg/png)"
        )

    # Build unique file name
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": file.filename,
        "unique_name": unique_filename,
        "url": f"/static/{unique_filename}",
        "size": file_size
    }
