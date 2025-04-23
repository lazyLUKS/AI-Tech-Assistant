# backend/Dockerfile

# --- Stage 1: Build Environment ---
# Use a base Python image. Consider NVIDIA PyTorch image if needed:
# FROM nvcr.io/nvidia/pytorch:23.10-py3
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_NO_INTERACTION=1 \
    # Set backend host to listen on all interfaces within the container
    HOST_IP=0.0.0.0 \
    # Set default port (can be overridden)
    PORT=8000

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for building packages)
# May need build-essential, cmake, etc., depending on exact requirements
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#  && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
# NOTE: vLLM installation can be complex depending on CUDA version.
# Ensure your torch version matches vLLM requirements and CUDA compatibility.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Ensure static directories exist (though config.py also does this)
# RUN mkdir -p /app/app/static/uploads /app/app/static/audio

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run the application using uvicorn directly
# Uvicorn is generally preferred over `python run.py` in production containers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- Optional: If using run.py instead ---
# CMD ["python", "run.py"]
