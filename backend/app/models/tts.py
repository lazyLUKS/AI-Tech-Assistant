from pydantic import BaseModel
from typing import Optional, Literal

# Define Pydantic models directly in this file

TTS_Task_Status = Literal["processing", "done", "failed"]

class TTSStatusResponse(BaseModel):
    """Response model for TTS task status."""
    status: TTS_Task_Status
    audio_url: Optional[str] = None
    error: Optional[str] = None
