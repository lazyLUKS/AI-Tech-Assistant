import os
import uuid
import logging
from pathlib import Path

# Use try-except for optional dependency
try:
    from TTS.api import TTS
except ImportError:
    TTS = None # type: ignore

from ..core.config import settings
from ..core import tts_manager

logger = logging.getLogger(__name__)

# --- Global TTS Model Instance ---
# Initialize based on config
tts_model = None
if TTS:
    try:
        logger.info(f"Initializing TTS model: {settings.TTS_MODEL} (GPU: {settings.ENABLE_GPU_TTS})")
        # Note: GPU usage might fail if CUDA is not available or VRAM is insufficient
        tts_model = TTS(
            model_name=settings.TTS_MODEL,
            progress_bar=False,
            gpu=settings.ENABLE_GPU_TTS
        )
        logger.info("TTS model initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize TTS model: {e}", exc_info=True)
        # Continue without TTS functionality
        tts_model = None
else:
    logger.warning("TTS library not installed. TTS functionality disabled.")
# --- ---

def synthesize_text_background(text: str, task_id: str):
    """
    Background task to synthesize speech, save it, and update task status.
    """
    if not tts_model:
        logger.error("TTS model not available. Cannot synthesize.")
        tts_manager.update_tts_task_status(task_id, status="failed", error="TTS model not available.")
        return

    try:
        audio_filename = f"audio_{task_id}.wav" # Use task_id for uniqueness
        audio_save_path = settings.audio_path / audio_filename

        logger.info(f"Synthesizing TTS for task {task_id} to {audio_save_path}...")
        # Generate audio file from text.
        tts_model.tts_to_file(text=text, file_path=str(audio_save_path))
        logger.info(f"TTS synthesis complete for task {task_id}.")

        # Construct the absolute URL for the client to fetch
        # Assumes static files served at /static/audio
        audio_url = f"http://{settings.HOST_IP}:{settings.PORT}/{settings.STATIC_DIR}/audio/{audio_filename}"

        tts_manager.update_tts_task_status(task_id, status="done", audio_url=audio_url)

    except Exception as e:
        logger.error(f"TTS synthesis failed for task {task_id}: {e}", exc_info=True)
        tts_manager.update_tts_task_status(task_id, status="failed", error=str(e))