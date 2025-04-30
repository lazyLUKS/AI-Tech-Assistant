import logging
import atexit
import torch.distributed as dist
from vllm import LLM
from vllm.sampling_params import SamplingParams

from .config import settings

logger = logging.getLogger(__name__)

# --- Global LLM Instance ---
try:
    logger.info(f"Initializing vLLM with model: {settings.MODEL_NAME}")
    llm = LLM(
        model=settings.MODEL_NAME,
        tokenizer_mode=settings.TOKENIZER_MODE,
        max_model_len=settings.MAX_MODEL_LEN,
        # tensor_parallel_size=settings.TENSOR_PARALLEL_SIZE # Uncomment if using TP
    )
    sampling_params = SamplingParams(max_tokens=settings.MAX_TOKENS)
    logger.info("vLLM initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize vLLM: {e}", exc_info=True)
    llm = None
    sampling_params = None

def generate_answer(question: str, text_context: str = "", image_url: str = None) -> str:
    """
    Generates an answer using the initialized Pixtral/vLLM model.

    Args:
        question: The user's question.
        text_context: Optional text context (e.g., from PDF).
        image_url: Optional URL to an image file (must be accessible by the server).

    Returns:
        The generated answer string.
    """
    if not llm or not sampling_params:
        logger.error("LLM not initialized. Cannot generate answer.")
        return "Error: The AI model is not available."

    system_message = {
        "role": "system",
        "content": [{
            "type": "text",
            "text": (
                "You are Sarah, a helpful AI assistant at the T-Systems Innovationcenter in Munich. "
                "Answer concisely in one or two brief paragraphs. Keep your responses short, clear, and to the point."
            )
        }]
    }

    prompt = question
    if text_context:
        prompt += f"\n\n--- Context ---\n{text_context}\n--- End Context ---"

    user_message_content = [{"type": "text", "text": prompt}]

    if image_url:
        # Ensure the image_url is accessible by the vLLM server instance
        # If running locally, file:// might work, but http:// is safer if serving files
        logger.info(f"Adding image to prompt: {image_url}")
        user_message_content.append({
            "type": "image_url",
            "image_url": {"url": image_url}
        })

    user_message = {
        "role": "user",
        "content": user_message_content
    }

    messages = [system_message, user_message]
    logger.debug(f"Sending messages to LLM: {messages}")

    try:
        outputs = llm.chat(messages, sampling_params=sampling_params)
        result = outputs[0].outputs[0].text
        logger.info("LLM generation successful.")

        # Optional: Truncate long responses (consider if needed)
        # max_length = 500
        # if len(result) > max_length:
        #     result = result[:max_length].rstrip() + "..."
        return result

    except Exception as e:
        logger.error(f"Error during LLM generation: {e}", exc_info=True)
        return "Error: Failed to generate response from AI model."

def cleanup_llm():
    """Cleans up distributed processes if initialized by vLLM."""
    if dist.is_initialized():
        logger.info("Destroying torch distributed process group.")
        dist.destroy_process_group()

# Register cleanup function to be called on exit
atexit.register(cleanup_llm)
