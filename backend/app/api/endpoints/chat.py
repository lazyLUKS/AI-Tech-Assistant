import logging
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse

from ....core import session_manager, tts_manager # Go up 3 levels to app, then core
from ....services import file_service, chat_service, tts_service # Go up 3 levels to app, then services
from ....models import chat as chat_models # Go up 3 levels to app, then models

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "/upload",
    response_model=chat_models.UploadResponse,
    responses={400: {"model": chat_models.ErrorResponse}, 500: {"model": chat_models.ErrorResponse}}
)
async def upload_file(
    mode: str = Form(..., description="Expected: 'upload_pdf' or 'upload_image'"),
    file: UploadFile = File(...)
):
    """Handles PDF or Image uploads, creates a session context."""
    session_context = {}
    actual_mode = ""

    if mode == "upload_pdf":
        try:
            # Call service function
            text_context = await file_service.process_uploaded_pdf(file)
            session_context = {"text_context": text_context}
            actual_mode = "pdf"
        except file_service.FileProcessingError as e:
            logger.error(f"PDF processing error: {e}", exc_info=True)
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error processing PDF: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error processing PDF.")

    elif mode == "upload_image":
        try:
             # Call service function
            image_path, image_url = await file_service.process_uploaded_image(file)
            session_context = {"image_url": image_url, "file_path": image_path}
            actual_mode = "image"
        except file_service.FileProcessingError as e:
            logger.error(f"Image processing error: {e}", exc_info=True)
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error processing image: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error processing image.")

    else:
        raise HTTPException(status_code=400, detail="Invalid mode specified for upload. Use 'upload_pdf' or 'upload_image'.")

    # Call session manager
    session_id = session_manager.create_session(mode=actual_mode, context_data=session_context)

    return chat_models.UploadResponse(
        session_id=session_id,
        filename=file.filename or "uploaded_file",
        mode=actual_mode
    )


@router.post(
    "/ask",
    response_model=chat_models.AskResponse,
    responses={500: {"model": chat_models.ErrorResponse}}
)
async def ask_question(
    background_tasks: BackgroundTasks,
    # Use Pydantic model for form data validation via Depends
    ask_request: chat_models.AskRequest = Depends(chat_models.AskRequest.as_form)
):
    """Receives a question, gets an answer from the LLM (with session context if provided),
       and optionally starts a TTS background task."""
    try:
        # Call chat service
        answer = await chat_service.get_answer(ask_request.question, ask_request.session_id)
    except Exception as e:
         logger.error(f"Error getting answer in endpoint: {e}", exc_info=True)
         raise HTTPException(status_code=500, detail="Failed to get answer from AI model.")

    response_data = chat_models.AskResponse(answer=answer)

    if ask_request.tts and tts_service.tts_model:
        # Call TTS manager and add task
        task_id = tts_manager.create_tts_task()
        background_tasks.add_task(tts_service.synthesize_text_background, answer, task_id)
        response_data.tts_task_id = task_id
        logger.info(f"TTS requested, added background task {task_id} for question: '{ask_request.question[:50]}...'")
    elif ask_request.tts and not tts_service.tts_model:
         logger.warning("TTS requested but TTS model is not available.")

    return response_data


@router.post(
    "/forget",
    response_model=chat_models.ForgetResponse,
    responses={404: {"model": chat_models.ErrorResponse}}
)
async def forget_session(
    # Use Pydantic model for form data validation via Depends
    forget_request: chat_models.ForgetRequest = Depends(chat_models.ForgetRequest.as_form)
):
    """Clears the specified session context."""
     # Call session manager
    cleared = session_manager.clear_session(forget_request.session_id)
    if cleared:
        return chat_models.ForgetResponse(message="Session cleared successfully.")
    else:
        raise HTTPException(status_code=404, detail="Session not found.")