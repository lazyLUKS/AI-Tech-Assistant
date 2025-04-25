import fitz  # PyMuPDF
from PIL import Image, UnidentifiedImageError
import logging
import os
import uuid
from pathlib import Path
from typing import Optional 

# If implementing backend STT, ensure config import is correct
# from app.core.config import settings

logger = logging.getLogger(__name__)

# --- Whisper Model (Optional - Load if doing backend STT) ---
# ... (Whisper loading code remains the same) ...

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts and returns text from a PDF file using PyMuPDF."""
    text = ""
    try:
        # Ensure the file exists before opening
        if not Path(pdf_path).is_file():
            logger.error(f"PDF file not found at path: {pdf_path}")
            return ""

        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
        doc.close() # Explicitly close the document
        logger.info(f"Successfully extracted text from PDF: {pdf_path}")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_path}: {e}", exc_info=True)
        return "" # Return empty string on error

def validate_and_load_image(image_path: str) -> Optional[Image.Image]:
    """
    Attempts to open an image file.
    Returns the PIL Image object or None if invalid.
    """
    try:
         # Ensure the file exists before opening
        if not Path(image_path).is_file():
            logger.error(f"Image file not found at path: {image_path}")
            return None

        img = Image.open(image_path)
        img.load()
        # img = img.convert("RGB")
        logger.info(f"Successfully loaded image: {image_path}")
        return img
    except UnidentifiedImageError:
        logger.warning(f"Cannot identify image file '{image_path}'. Not a valid image.")
        return None
    except Exception as e:
        logger.error(f"Error loading image {image_path}: {e}", exc_info=True)
        return None

async def save_uploaded_file(file_bytes: bytes, upload_dir: Path, desired_filename: str) -> Path:
    """Saves uploaded file bytes to a unique path in the upload directory."""
    safe_base = "".join(c if c.isalnum() or c in ['-', '_', '.'] else '_' for c in Path(desired_filename).stem)
    safe_ext = "".join(c if c.isalnum() or c == '.' else '' for c in Path(desired_filename).suffix)
    # Limit length to prevent issues
    safe_filename_base = f"{safe_base[:100]}{safe_ext[:10]}"

    unique_filename = f"{uuid.uuid4().hex}_{safe_filename_base}"
    file_path = upload_dir / unique_filename

    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        logger.info(f"Saved uploaded file to: {file_path}")
        return file_path
    except OSError as e:
        logger.error(f"Error saving file to {file_path}: {e}")
        raise 

