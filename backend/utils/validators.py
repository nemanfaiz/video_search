# utils/validators.py
from typing import Tuple, List, Final
import magic
import os
from django.core.files.uploadedfile import UploadedFile


# type aliases
ValidationResult = Tuple[bool, str]
MimeType = str


# constants with type annotations
# 100MB in bytes
MAX_FILE_SIZE: Final[int] = 100 * 1024 * 1024  

ACCEPTED_TYPES: Final[List[MimeType]] = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
]

def validate_video_file(file: UploadedFile) -> ValidationResult:
    """Validate video file type and size
    
    Args:
        file: Django uploaded file object to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: Boolean indicating if file is valid
        - error_message: String containing error message if invalid, empty string if valid
        
    Note:
        - Validates file size (must be < 100MB)
        - Validates MIME type (must be MP4, MOV, or AVI)
    """
    
    
    if file.size > MAX_FILE_SIZE:
        return False, "File size must be less than 100MB"
    
    # Check MIME type using python-magic
    mime_type = magic.from_buffer(file.read(1024), mime=True)
    
    # Reset file pointer to beginning
    file.seek(0)  
    
    if mime_type not in ACCEPTED_TYPES:
        return False, "Invalid file type. Please upload MP4, MOV, or AVI"
        
    return True, ""