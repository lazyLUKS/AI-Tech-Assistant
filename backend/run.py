import uvicorn
import logging
from app.core.config import settings # Import settings to ensure config is loaded

# Configure logging early
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info(f"Starting Uvicorn server on {settings.HOST_IP}:{settings.PORT}")
    uvicorn.run(
        "app.main:app", # Point to the FastAPI app instance
        host=settings.HOST_IP,
        port=settings.PORT,
        reload=True, # Enable auto-reload for development (consider disabling in production)
        log_level="info" # Uvicorn's log level
    )