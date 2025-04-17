import fitz  # PyMuPDF
from PIL import Image, UnidentifiedImageError
import logging
import os
import uuid
from pathlib import Path

# Uncomment if implementing backend STT
# import whisper
# from ..core.config import settings

logger = logging.getLogger(__name__)

# --- Whisper Model (Optional - Load if doing backend STT) ---
# try:
#     logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL}")
#     whisper_model = whisper.load_model(settings.WHISPER_MODEL)
#     logger.info("Whisper model loaded.")
# except Exception as e:
#     logger.error(f"Failed to load Whisper model: {e}", exc_info=True)
#     whisper_model = None
# --- ---

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts and returns text from a PDF file using PyMuPDF."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
        logger.info(f"Successfully extracted text from PDF: {pdf_path}")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_path}: {e}", exc_info=True)
        return "" # Return empty string on failure

def validate_and_load_image(image_path: str) -> Optional[Image.Image]:
    """
    Attempts to open an image file and convert it to RGB.
    Returns the PIL Image object or None if invalid.
    """
    try:
        img = Image.open(image_path)
        logger.info(f"Successfully loaded image: {image_path}")
        return img.convert("RGB")
    except UnidentifiedImageError:
        logger.error(f"Error: Cannot identify image file '{image_path}'. Not a valid image.")
        return None
    except Exception as e:
        logger.error(f"Error loading image {image_path}: {e}", exc_info=True)
        return None

def save_uploaded_file(file: bytes, upload_dir: Path, original_filename: str) -> Path:
    """Saves uploaded file bytes to a unique path in the upload directory."""
    # Create a unique filename to avoid collisions
    file_extension = Path(original_filename).suffix
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = upload_dir / unique_filename

    try:
        with open(file_path, "wb") as f:
            f.write(file)
        logger.info(f"Saved uploaded file to: {file_path}")
        return file_path
    except OSError as e:
        logger.error(f"Error saving file to {file_path}: {e}")
        raise # Re-raise the exception to be handled by the endpoint

# --- Optional: Backend STT ---
# def transcribe_audio(audio_file_path: str) -> str:
#     """
#     Transcribes the given audio file using the loaded Whisper model.
#     Returns the transcribed text or empty string on failure.
#     """
#     if not whisper_model:
#         logger.error("Whisper model not loaded. Cannot transcribe.")
#         return ""
#     try:
#         logger.info(f"Transcribing audio file: {audio_file_path}")
#         # Ensure file exists before passing to whisper
#         if not os.path.exists(audio_file_path):
#             logger.error(f"Audio file not found: {audio_file_path}")
#             return ""
#         result = whisper_model.transcribe(audio_file_path)
#         logger.info("Audio transcription successful.")
#         return result.get("text", "")
#     except Exception as e:
#         logger.error(f"Error during audio transcription: {e}", exc_info=True)
#         return ""
# --- ---