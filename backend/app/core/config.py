import os
from pydantic_settings import BaseSettings
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    HOST_IP: str = "127.0.0.1"
    PORT: int = 8000

    # LLM Settings
    MODEL_NAME: str = "mistralai/Pixtral-12B-2409"
    MAX_MODEL_LEN: int = 8192
    TOKENIZER_MODE: str = "mistral"
    MAX_TOKENS: int = 512
    # TENSOR_PARALLEL_SIZE: int = 1 # Uncomment and set if using >1 GPU for vLLM

    # TTS Settings
    TTS_MODEL: str = "tts_models/en/ljspeech/vits"
    ENABLE_GPU_TTS: bool = False

    # Whisper Settings (Uncomment if implementing backend STT)
    # WHISPER_MODEL: str = "large-v3-turbo"

    # Static File Paths
    STATIC_DIR: str = "static"
    UPLOAD_DIR: str = "static/uploads"
    AUDIO_DIR: str = "static/audio"

    # Derived paths
    @property
    def upload_path(self) -> Path:
        # Construct path relative to the main.py location (app/)
        app_dir = BACKEND_ROOT / "app"
        return app_dir / self.UPLOAD_DIR

    @property
    def audio_path(self) -> Path:
        app_dir = BACKEND_ROOT / "app"
        return app_dir / self.AUDIO_DIR

    # Allows loading from .env file
    class Config:
        env_file = BACKEND_ROOT / '.env'
        env_file_encoding = 'utf-8'
        extra = 'ignore' # Ignore extra fields in .env

# Create a single instance to be imported
settings = Settings()

# Ensure static directories exist on startup
if not settings.upload_path.exists():
    settings.upload_path.mkdir(parents=True, exist_ok=True)
if not settings.audio_path.exists():
    settings.audio_path.mkdir(parents=True, exist_ok=True)
