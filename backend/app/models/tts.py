from pydantic import BaseModel
from typing import Optional, Literal

TTS_Task_Status = Literal["processing", "done", "failed"]

class TTSStatusResponse(BaseModel):
    status: TTS_Task_Status
    audio_url: Optional[str] = None
    error: Optional[str] = None

class TTSNotFoundErrorResponse(BaseModel):
    error: str = "Task not found"