import logging
import asyncio

# Correct relative imports
from ..core import llm, session_manager
from . import file_service # Imports file_service from the same package ('services')

logger = logging.getLogger(__name__)

async def get_answer(question: str, session_id: str = None) -> str:
    """
    Gets an answer, potentially using context from the session.
    Runs the LLM generation in an executor to avoid blocking the event loop.
    """
    text_context = ""
    image_url = None

    if session_id:
        session_data = session_manager.get_session(session_id)
        if session_data:
            logger.info(f"Using context from session {session_id} (mode: {session_data.get('mode')})")
            if session_data["mode"] == "pdf":
                text_context = session_data.get("text_context", "")
            elif session_data["mode"] == "image":
                image_url = session_data.get("image_url", "")
        else:
            logger.warning(f"Session ID {session_id} provided but not found.")

    # Run the potentially blocking LLM call in a separate thread
    try:
        loop = asyncio.get_event_loop()
        answer = await loop.run_in_executor(
            None, # Use default executor
            llm.generate_answer, # Call function from core.llm
            question,
            text_context,
            image_url
        )
        return answer
    except Exception as e:
        logger.error(f"Error getting answer from LLM service: {e}", exc_info=True)
        return "Sorry, an error occurred while processing your request."