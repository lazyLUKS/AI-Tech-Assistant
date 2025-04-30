from fastapi import APIRouter

from .endpoints import chat, tts
api_router = APIRouter()

api_router.include_router(chat.router, prefix="/chat", tags=["Chat & Upload"])
api_router.include_router(tts.router, prefix="/tts", tags=["Text-to-Speech"])

# You can add more routers here as the application grows