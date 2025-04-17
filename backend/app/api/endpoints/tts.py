import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ...core import tts_manager
from ...models import tts as tts_models # Import pydantic models

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/audio_status/{task_id}",
    response_model=tts_models.TTSStatusResponse,
    responses={404: {"model": tts_models.TTSNotFoundErrorResponse}}
)
async def get_audio_status(task_id: str):
    """Checks the status of a TTS synthesis background task."""
    task_data = tts_manager.get_tts_task(task_id)
    if task_data:
        logger.debug(f"Retrieved TTS status for task {task_id}: {task_data['status']}")
        return tts_models.TTSStatusResponse(**task_data)
    else:
        logger.warning(f"TTS status request for unknown task_id: {task_id}")
        raise HTTPException(status_code=404, detail="Task not found")