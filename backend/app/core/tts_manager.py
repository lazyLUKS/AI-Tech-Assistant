import uuid
import logging
from typing import Dict, Optional, Any, Literal 

logger = logging.getLogger(__name__)

# In-memory store for TTS tasks
_tts_tasks: Dict[str, Dict[str, Any]] = {} 

TTS_Task_Status = Literal["processing", "done", "failed"]

def create_tts_task() -> str:
    """Creates a placeholder for a new TTS task and returns the task ID."""
    task_id = uuid.uuid4().hex
    _tts_tasks[task_id] = {"status": "processing", "audio_url": None, "error": None}
    logger.info(f"Created TTS task {task_id}")
    return task_id

def update_tts_task_status(
    task_id: str,
    status: TTS_Task_Status, 
    audio_url: Optional[str] = None,
    error: Optional[str] = None
):
    """Updates the status and result of a TTS task."""
    if task_id in _tts_tasks:
        _tts_tasks[task_id]["status"] = status
        _tts_tasks[task_id]["audio_url"] = audio_url
        _tts_tasks[task_id]["error"] = error
        logger.info(f"Updated TTS task {task_id} status to {status}")
    else:
        logger.warning(f"Attempted to update non-existent TTS task: {task_id}")

def get_tts_task(task_id: str) -> Optional[Dict[str, Any]]: 
    """Retrieves the status and result of a TTS task."""
    return _tts_tasks.get(task_id)

def cleanup_tts_tasks():
    """Optional: Clean up old/stuck tasks if needed."""
    # Example: Remove tasks older than 1 hour
    # import time
    # cutoff = time.time() - 3600
    # tasks_to_remove = [tid for tid, task in _tts_tasks.items() if task.get('timestamp', 0) < cutoff]
    # for tid in tasks_to_remove:
    #     _tts_tasks.pop(tid, None)
    #     logger.info(f"Cleaned up old TTS task {tid}")
    # Clear all on shutdown for this example
    logger.info("Cleaning up TTS tasks...")
    _tts_tasks.clear()
    logger.info("TTS task cleanup complete.")
