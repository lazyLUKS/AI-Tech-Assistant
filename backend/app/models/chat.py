from pydantic import BaseModel, Field
from typing import Optional

class UploadResponse(BaseModel):
    session_id: str
    filename: str
    mode: str

class AskRequest(BaseModel):
    question: str = Field(..., description="The question to ask the AI.")
    session_id: Optional[str] = Field(None, description="Optional session ID for context.")
    tts: bool = Field(False, description="Whether to synthesize the answer to speech.")

class AskResponse(BaseModel):
    answer: str
    tts_task_id: Optional[str] = None

class ForgetRequest(BaseModel):
    session_id: str = Field(..., description="The session ID to clear.")

class ForgetResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str