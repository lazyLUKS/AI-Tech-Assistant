from pydantic import BaseModel

class ErrorResponse(BaseModel):
    """Standard error response model."""
    detail: str