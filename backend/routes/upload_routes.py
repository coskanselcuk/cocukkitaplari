from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import os
import uuid
import shutil

router = APIRouter(prefix="/upload", tags=["upload"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file and return its URL"""
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Dosya türü desteklenmiyor. İzin verilen: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read and validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Dosya çok büyük. Maksimum boyut: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{unique_id}{file_ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Return the URL path (will be served via static files or this router)
    return {
        "success": True,
        "filename": safe_filename,
        "url": f"/api/upload/images/{safe_filename}",
        "size": len(content)
    }


@router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve an uploaded image"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resim bulunamadı")
    
    # Security check - ensure we're not serving files outside uploads dir
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Erişim engellendi")
    
    return FileResponse(file_path)


@router.delete("/images/{filename}")
async def delete_image(filename: str):
    """Delete an uploaded image"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resim bulunamadı")
    
    # Security check
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Erişim engellendi")
    
    os.remove(file_path)
    return {"success": True, "message": "Resim silindi"}
