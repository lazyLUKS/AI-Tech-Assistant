import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from .api.router import api_router
from .core.config import settings
from .core import llm, session_manager, tts_manager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application startup...")
    logger.info(f"Model Name: {settings.MODEL_NAME}")
    logger.info(f"TTS Model: {settings.TTS_MODEL}")
    logger.info(f"Host: {settings.HOST_IP}:{settings.PORT}")
    logger.info(f"Upload dir: {settings.upload_path}")
    logger.info(f"Audio dir: {settings.audio_path}")
    logger.info("Application startup complete.")
    yield
    # Shutdown
    logger.info("Application shutdown...")
    session_manager.cleanup_all_sessions()
    tts_manager.cleanup_tts_tasks()
    llm.cleanup_llm()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="Local AI Chat Assistant API",
    description="API for multimodal chat with Pixtral, including PDF/Image analysis and TTS.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
app.include_router(api_router, prefix="/api/v1") 

# Static Files
# Define the path relative to this main.py file's location (inside 'app')
static_directory_path = Path(__file__).parent / settings.STATIC_DIR
try:
    app.mount(f"/{settings.STATIC_DIR}", StaticFiles(directory=static_directory_path), name="static")
    logger.info(f"Mounted static directory '{static_directory_path}' at '/{settings.STATIC_DIR}'")
except RuntimeError as e:
     logger.error(f"Error mounting static directory '{static_directory_path}': {e}. "
                  "Ensure the directory exists relative to 'backend/app'.")


# Root Endpoint
@app.get("/", tags=["Root"], include_in_schema=False) 
async def read_root():
    return {"message": "Welcome to the Local AI Chat Assistant API! Docs available at /docs"}
