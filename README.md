# Local Chat Assistant with Pixtral

This project implements a web-based AI assistant that can answer questions based on text, uploaded PDF documents, or uploaded images. It uses the Pixtral-12B model via vLLM for multimodal understanding and generation, FastAPI for the backend API, and Next.js for the frontend chat interface.

**Features:**

* **Multimodal Chat:** Engage in text-based chat or ask questions about uploaded PDFs and images.
* **PDF Text Extraction:** Extracts text content from PDF files for context.
* **Image Understanding:** Analyzes uploaded images to answer related questions.
* **Text-to-Speech (TTS):** Optional voice output for AI responses using the `TTS` library.
* **Speech-to-Text (STT):** Optional voice input using the browser's Speech Recognition API and Whisper `large-v3-turbo` for transcription (backend-side).
* **Real-time Interaction:** FastAPI backend with a responsive Next.js frontend.
* **Session Management:** Maintains context (uploaded file) within a session.

## Architecture

The project is divided into two main parts:

1.  **Backend (FastAPI):**
    * Located in the `backend/` directory.
    * Serves the API endpoints for chat, file uploads, and TTS.
    * Handles interaction with the Pixtral model (via vLLM).
    * Performs PDF text extraction, image loading, and TTS synthesis.
    * Manages temporary session data (uploaded file context) and TTS task status in memory.
    * Serves static files (uploaded images, generated audio).
2.  **Frontend (Next.js):**
    * Located in the `frontend/` directory.
    * Provides the user interface (chatbox).
    * Handles user input (text, voice), file selection, and API calls to the backend.
    * Displays chat history and loading indicators.
    * Plays back TTS audio.


## Setup

### Prerequisites

* Python 3.9+
* Node.js 18+ and npm/yarn/pnpm
* NVIDIA GPU with CUDA drivers compatible with vLLM and PyTorch (for backend)
* Access to the Pixtral-12B model weights (or another compatible vLLM model)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Note: `requirements.txt` includes core dependencies. Ensure your environment meets `vllm` prerequisites.*
4.  **Configure Environment Variables:**
    * Copy `.env.example` to `.env`: `cp .env.example .env`
    * Edit `.env` and fill in the required values:
        * `HOST_IP`: The IP address the backend server will be accessible from (e.g., `127.0.0.1` or your machine's network IP). **Crucial for frontend and TTS audio URLs.**
        * `PORT`: The port the backend server will run on (default: 8000).
        * `MODEL_NAME`: The Hugging Face identifier for the vLLM model (default: `mistralai/Pixtral-12B-2409`).
        * `MAX_MODEL_LEN`: Maximum model length for vLLM (adjust based on GPU memory).
        * `MAX_TOKENS`: Maximum number of tokens for the model to generate.
        * `TTS_MODEL`: TTS model name (default: `tts_models/en/ljspeech/vits`).
        * `WHISPER_MODEL`: Whisper model name (default: `large-v3-turbo`).
        * `ENABLE_GPU_TTS`: Set to `true` or `false` for TTS GPU usage.
5.  **Run the backend server:**
    ```bash
    python run.py
    ```
    The API will be available at `http://<HOST_IP>:<PORT>` (e.g., `http://localhost:8000`).

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # or yarn install or pnpm install
    ```
3.  **Configure Environment Variables:**
    * Create a `.env.development` file (for `npm run dev`) or `.env.production` file (for `npm run build`/`start`).
    * Add the backend API URL:
        ```
        NEXT_PUBLIC_API_URL=http://<BACKEND_HOST_IP>:<BACKEND_PORT>
        ```
        Replace `<BACKEND_HOST_IP>` and `<BACKEND_PORT>` with the values from the backend's `.env` file (e.g., `NEXT_PUBLIC_API_URL=http://localhost:8000`).
4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000`.

### Docker Setup (Optional)

A basic `docker-compose.yml` is provided as an example. You will need to customize it based on your specific vLLM setup (GPU access, model mounting, etc.).

```bash
# Build and run the services (adjust docker-compose.yml first)
docker-compose up --build