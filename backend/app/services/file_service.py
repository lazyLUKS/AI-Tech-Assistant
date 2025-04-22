import logging
import os
import uuid
from pathlib import Path
from fastapi import UploadFile

# Corrected: Use absolute imports from the 'app' package root
from app.core.config import settings
from app.utils import file_utils

logger = logging.getLogger(__name__)

class FileProcessingError(Exception):
    """Custom exception for file processing errors."""
    pass

async def process_uploaded_pdf(file: UploadFile) -> str:
    """Saves PDF temporarily, extracts text, and cleans up."""
    temp_pdf_path = None
    try:
        # Use helper from file_utils
        temp_pdf_path_str = f"temp_{uuid.uuid4().hex}.pdf" # Generate name first
        temp_pdf_path = await file_utils.save_uploaded_file(
            await file.read(),
            settings.upload_path,
            temp_pdf_path_str
        )

        # Extract text using helper
        text_context = file_utils.extract_text_from_pdf(str(temp_pdf_path))
        if not text_context:
             logger.warning(f"No text extracted from PDF: {file.filename}")
             # Consider raising FileProcessingError("Could not extract text from the PDF.")

        return text_context
    except Exception as e:
        logger.error(f"Failed to process PDF {file.filename}: {e}", exc_info=True)
        raise FileProcessingError(f"Failed to process PDF: {e}")
    finally:
        # Clean up temporary file
        if temp_pdf_path and temp_pdf_path.exists():
            try:
                os.remove(temp_pdf_path)
                logger.info(f"Cleaned up temporary PDF: {temp_pdf_path}")
            except OSError as e:
                logger.error(f"Error removing temporary PDF {temp_pdf_path}: {e}")


async def process_uploaded_image(file: UploadFile) -> tuple[str, str]:
    """Saves image permanently (until session ends) and validates it."""
    image_path = None
    try:
        # Save using helper
        image_path = await file_utils.save_uploaded_file(
            await file.read(),
            settings.upload_path, # Destination directory from config
            file.filename or f"{uuid.uuid4().hex}.png" # Use original name or generate one
        )

        # Validate using helper
        if file_utils.validate_and_load_image(str(image_path)) is None:
            if image_path.exists():
                os.remove(image_path)
            logger.error(f"Uploaded file '{file.filename}' is not a valid image.")
            raise FileProcessingError("Uploaded file is not a valid image.")

        # Construct URL
        image_url = f"http://{settings.HOST_IP}:{settings.PORT}/{settings.STATIC_DIR}/uploads/{image_path.name}"
        logger.info(f"Image processed. URL: {image_url}, Path: {image_path}")

        return str(image_path), image_url

    except Exception as e:
        if image_path and image_path.exists():
             try:
                 os.remove(image_path)
             except OSError:
                 pass
        logger.error(f"Failed to process image {file.filename}: {e}", exc_info=True)
        if isinstance(e, FileProcessingError):
             raise
        else:
             raise FileProcessingError("An internal error occurred while processing the image.")

