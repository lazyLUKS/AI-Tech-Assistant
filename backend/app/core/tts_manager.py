import uuid
import logging
from typing import Dict, Optional, Literal

logger = logging.getLogger(__name__)

# --- Global TTS Task Storage ---
# Replace with DB/Redis/Celery for production
_tts_tasks: Dict[str, Dict] = {}
# --- ---

TTS_Task_Status = Literal["processing", "done", "failed"]

def create_tts_task() -> str:
    """Creates a placeholder for a new TTS task and returns the task ID."""
    task_id = uuid.uuid4().hex
    _tts_tasks[task_id] = {"status": "processing", "audio_url": None, "error": None}
    logger.info(f"Created TTS task {task_id}")
    return task_id

def update_tts_task_status(task_id: str, status: TTS_Task_Status, audio_url: Optional[str] = None, error: Optional[str] = None):
    """Updates the status and result of a TTS task."""
    if task_id in _tts_tasks:
        _tts_tasks[task_id]["status"] = status
        if audio_url:
            _tts_tasks[task_id]["audio_url"] = audio_url
        if error:
             _tts_tasks[task_id]["error"] = error
        logger.info(f"Updated TTS task {task_id} status to {status}")
    else:
        logger.warning(f"Attempted to update non-existent TTS task: {task_id}")

def get_tts_task(task_id: str) -> Optional[Dict]:
    """Retrieves the status and result of a TTS task."""
    return _tts_tasks.get(task_id)

def cleanup_tts_tasks():
    """Optional: Clean up old/stuck tasks if needed."""
    # Implement logic to remove tasks older than a certain time, etc.
    logger.info("Cleaning up TTS tasks (implementation pending).")