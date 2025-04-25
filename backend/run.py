import uvicorn
import logging
from app.core.config import settings 

# Configure logging early
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info(f"Starting Uvicorn server on {settings.HOST_IP}:{settings.PORT}")
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST_IP,
        port=settings.PORT,
        reload=True, 
        log_level="info" 
    )
