
# Use a base Python image. Consider NVIDIA PyTorch image if needed:
# FROM nvcr.io/nvidia/pytorch:23.10-py3
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_NO_INTERACTION=1 \
    HOST_IP=0.0.0.0 \
    PORT=8000

# Set working directory
WORKDIR /app

COPY requirements.txt .

# NOTE: vLLM installation can be complex depending on CUDA version.
# Ensure your torch version matches vLLM requirements and CUDA compatibility.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .


EXPOSE ${PORT}

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- Optional: If using run.py instead ---
# CMD ["python", "run.py"]
