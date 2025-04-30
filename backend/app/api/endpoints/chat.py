from __future__ import annotations 

import logging
from fastapi import (
    APIRouter, Form, UploadFile, File, HTTPException, BackgroundTasks, Depends
)
from fastapi.responses import JSONResponse
from typing import Optional


from app.core import session_manager, tts_manager
from app.services import file_service, chat_service, tts_service
from app.models import chat as chat_models
from app.models.error import ErrorResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/upload",
    response_model=chat_models.UploadResponse, 
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input or file processing error"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def upload_file(
    mode: str = Form(..., description="Expected: 'upload_pdf' or 'upload_image'"),
    file: UploadFile = File(...)
):
    """Handles PDF or Image uploads, creates a session context."""
    session_context = {}
    actual_mode = ""
    try:
        if mode == "upload_pdf":
            text_context = await file_service.process_uploaded_pdf(file)
            session_context = {"text_context": text_context}
            actual_mode = "pdf"
        elif mode == "upload_image":
            image_path, image_url = await file_service.process_uploaded_image(file)
            session_context = {"image_url": image_url, "file_path": image_path}
            actual_mode = "image"
        else:
            logger.warning(f"Invalid upload mode received: {mode}")
            raise HTTPException(status_code=400, detail="Invalid mode specified. Use 'upload_pdf' or 'upload_image'.")

        session_id = session_manager.create_session(mode=actual_mode, context_data=session_context)
        return chat_models.UploadResponse(
            session_id=session_id,
            filename=file.filename or "uploaded_file",
            mode=actual_mode
        )
    except file_service.FileProcessingError as e:
        logger.warning(f"File processing error for {file.filename} (mode: {mode}): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during upload {file.filename} (mode: {mode}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error processing {mode.split('_')[-1]}.")


@router.post(
    "/ask",
    response_model=chat_models.AskResponse, 
    responses={500: {"model": ErrorResponse}}
)
async def ask_question(
    background_tasks: BackgroundTasks,
    question: str = Form(..., description="The question to ask the AI."),
    session_id: Optional[str] = Form(None, description="Optional session ID for context."),
    tts: bool = Form(False, description="Whether to synthesize the answer to speech.")
):
    """Receives a question, gets an answer from the LLM (with session context if provided),
       and optionally starts a TTS background task."""
    try:
        answer = await chat_service.get_answer(question, session_id)
    except Exception as e:
         logger.error(f"Error getting answer in endpoint: {e}", exc_info=True)
         raise HTTPException(status_code=500, detail="Failed to get answer from AI model.")

    response_data = chat_models.AskResponse(answer=answer)

    if tts and tts_service.tts_model:
        task_id = tts_manager.create_tts_task()
        background_tasks.add_task(tts_service.synthesize_text_background, answer, task_id)
        response_data.tts_task_id = task_id
        logger.info(f"TTS requested, added background task {task_id}")
    elif tts and not tts_service.tts_model:
         logger.warning("TTS requested but TTS model is not available.")

    return response_data


@router.post(
    "/forget",
    response_model=chat_models.ForgetResponse, 
    responses={404: {"model": ErrorResponse}}
)
async def forget_session(
    session_id: str = Form(..., description="The session ID to clear.")
):
    """Clears the specified session context."""
    cleared = session_manager.clear_session(session_id)
    if cleared:
        return chat_models.ForgetResponse(message="Session cleared successfully.")
    else:
        logger.warning(f"Forget request for non-existent session: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found.")
