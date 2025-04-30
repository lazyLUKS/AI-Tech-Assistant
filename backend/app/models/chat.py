from pydantic import BaseModel, Field
from typing import Optional

class UploadResponse(BaseModel):
    session_id: str
    filename: str
    mode: str # 'pdf' or 'image'

class AskRequest(BaseModel):
    # This model is no longer used directly for form input via Depends,
    # but can be kept for documentation or potential future use (e.g., JSON body input)
    question: str = Field(..., description="The question to ask the AI.")
    session_id: Optional[str] = Field(None, description="Optional session ID for context.")
    tts: bool = Field(False, description="Whether to synthesize the answer to speech.")

class AskResponse(BaseModel):
    answer: str
    tts_task_id: Optional[str] = None

class ForgetRequest(BaseModel):
     # This model is no longer used directly for form input via Depends
    session_id: str = Field(..., description="The session ID to clear.")

class ForgetResponse(BaseModel):
    message: str