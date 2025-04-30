from __future__ import annotations # Keep this for forward references

import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

# Use absolute imports from the 'app' package root
from app.core import tts_manager
from app.models import tts as tts_models # Import the models module
from app.models.error import ErrorResponse # Import the error model

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/audio_status/{task_id}",
    response_model=tts_models.TTSStatusResponse, # Reference the model correctly
    responses={404: {"model": ErrorResponse, "description": "Task not found"}}
)
async def get_audio_status(task_id: str):
    """Checks the status of a TTS synthesis background task."""
    task_data = tts_manager.get_tts_task(task_id)
    if task_data:
        logger.debug(f"Retrieved TTS status for task {task_id}: {task_data.get('status')}")
        # Ensure the response model keys match the data dictionary keys
        return tts_models.TTSStatusResponse(
            status=task_data.get("status", "failed"), # Use Literal type here
            audio_url=task_data.get("audio_url"),
            error=task_data.get("error")
        )
    else:
        logger.warning(f"TTS status request for unknown task_id: {task_id}")
        raise HTTPException(status_code=404, detail="Task not found")