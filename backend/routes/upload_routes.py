"""
Upload Routes - Cloudinary Integration
Handles image uploads to Cloudinary cloud storage
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import os
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api

router = APIRouter(prefix="/upload", tags=["upload"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Local uploads directory (for backward compatibility/fallback)
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image to Cloudinary and return its URL"""
    
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
    
    # Generate unique public_id for Cloudinary
    unique_id = str(uuid.uuid4())[:12]
    public_id = f"cocuk_kitaplari/{unique_id}"
    
    try:
        # Upload to Cloudinary
        # Reset file position to beginning
        await file.seek(0)
        
        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            folder="cocuk_kitaplari",
            resource_type="image",
            overwrite=True,
            transformation=[
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        # Return Cloudinary URL
        return {
            "success": True,
            "filename": result.get("public_id"),
            "url": result.get("secure_url"),
            "size": len(content),
            "cloudinary_id": result.get("public_id"),
            "format": result.get("format"),
            "width": result.get("width"),
            "height": result.get("height")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary yükleme hatası: {str(e)}"
        )


@router.get("/images/{filename}")
async def get_image(filename: str):
    """
    Serve an uploaded image from local storage (backward compatibility).
    New images are stored on Cloudinary and served directly from there.
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resim bulunamadı")
    
    # Security check - ensure we're not serving files outside uploads dir
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Erişim engellendi")
    
    return FileResponse(file_path)


@router.delete("/images/{filename}")
async def delete_image(filename: str):
    """Delete an image - handles both local and Cloudinary images"""
    
    # Check if it's a Cloudinary public_id (contains /)
    if "/" in filename or filename.startswith("cocuk_kitaplari"):
        try:
            result = cloudinary.uploader.destroy(filename)
            if result.get("result") == "ok":
                return {"success": True, "message": "Cloudinary resmi silindi"}
            else:
                raise HTTPException(status_code=404, detail="Cloudinary resmi bulunamadı")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Silme hatası: {str(e)}")
    
    # Local file deletion (backward compatibility)
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resim bulunamadı")
    
    # Security check
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Erişim engellendi")
    
    os.remove(file_path)
    return {"success": True, "message": "Yerel resim silindi"}


@router.post("/migrate-to-cloudinary")
async def migrate_local_to_cloudinary():
    """
    Admin endpoint: Migrate all local images to Cloudinary.
    Returns a mapping of old URLs to new Cloudinary URLs.
    """
    if not UPLOAD_DIR.exists():
        return {"success": True, "migrated": 0, "message": "No local images to migrate"}
    
    local_files = list(UPLOAD_DIR.glob("*"))
    image_files = [f for f in local_files if f.suffix.lower() in ALLOWED_EXTENSIONS]
    
    if not image_files:
        return {"success": True, "migrated": 0, "message": "No image files found"}
    
    migrated = []
    errors = []
    
    for file_path in image_files:
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                str(file_path),
                public_id=f"cocuk_kitaplari/migrated_{file_path.stem}",
                folder="cocuk_kitaplari",
                resource_type="image",
                overwrite=True
            )
            
            migrated.append({
                "original_filename": file_path.name,
                "old_url": f"/api/upload/images/{file_path.name}",
                "new_url": result.get("secure_url"),
                "cloudinary_id": result.get("public_id")
            })
            
        except Exception as e:
            errors.append({
                "filename": file_path.name,
                "error": str(e)
            })
    
    return {
        "success": True,
        "migrated": len(migrated),
        "errors": len(errors),
        "migrations": migrated,
        "error_details": errors
    }
