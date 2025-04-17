import uuid
import os
import logging
from typing import Dict, Any, Optional

from .config import settings

logger = logging.getLogger(__name__)

# In-memory session storage (replace with DB/Redis for production)
_session_data: Dict[str, Dict[str, Any]] = {}

def create_session(mode: str, context_data: Dict[str, Any]) -> str:
    """Creates a new session and returns the session ID."""
    session_id = uuid.uuid4().hex
    _session_data[session_id] = {
        "mode": mode,
        **context_data # e.g., {"text_context": text} or {"image_url": url, "file_path": path}
    }
    logger.info(f"Created session {session_id} for mode {mode}")
    return session_id

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves session data."""
    return _session_data.get(session_id)

def clear_session(session_id: str) -> bool:
    """Clears a session and cleans up associated files."""
    if session_id in _session_data:
        data = _session_data.pop(session_id)
        logger.info(f"Session {session_id} data cleared.")

        # Clean up uploaded files associated with the session
        if data["mode"] == "image":
            file_path = data.get("file_path")
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Removed uploaded image file: {file_path}")
                except OSError as e:
                    logger.error(f"Error removing file {file_path}: {e}")
        elif data["mode"] == "pdf":
             # Clean up temporary PDF if it wasn't already
             temp_pdf_path = data.get("temp_pdf_path")
             if temp_pdf_path and os.path.exists(temp_pdf_path):
                 try:
                     os.remove(temp_pdf_path)
                     logger.info(f"Removed temporary pdf file: {temp_pdf_path}")
                 except OSError as e:
                     logger.error(f"Error removing file {temp_pdf_path}: {e}")

        return True
    else:
        logger.warning(f"Attempted to clear non-existent session: {session_id}")
        return False

def cleanup_all_sessions():
    """Clears all active sessions and their files (e.g., on shutdown)."""
    logger.info("Cleaning up all active sessions...")
    session_ids = list(_session_data.keys())
    for session_id in session_ids:
        clear_session(session_id)
    logger.info("Session cleanup complete.")

# Optional: Consider registering cleanup_all_sessions with atexit or FastAPI lifespan