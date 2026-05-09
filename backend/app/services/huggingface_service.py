"""
huggingface_service.py

Calls a HuggingFace Inference Endpoint (dedicated or serverless).
Supports two modes:
  1. Dedicated endpoint with OpenAI-compatible /v1/chat/completions
  2. Raw text-generation endpoint (HF Inference API format)
"""

import logging
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)


def _is_openai_compatible() -> bool:
    """Heuristic: dedicated endpoints served with TGI >= 2.x support /v1/chat/completions."""
    endpoint = settings.huggingface_endpoint_url or ''
    return 'endpoints.huggingface.cloud' in endpoint


def call_huggingface_model(prompt: str, timeout: float = 90.0) -> str:
    """
    Send a prompt to HuggingFace.

    Tries the OpenAI-compatible chat completions format first if the endpoint
    looks like a dedicated HF endpoint, otherwise falls back to the raw
    text-generation API format.

    Args:
        prompt:   Plain-text prompt string.
        timeout:  HTTP timeout in seconds.

    Returns:
        Generated text as a string.

    Raises:
        RuntimeError if the API key or endpoint URL is missing or request fails.
    """
    api_key = settings.huggingface_api_key
    endpoint = settings.huggingface_endpoint_url

    if not api_key:
        raise RuntimeError(
            'HUGGINGFACE_API_KEY is not set. '
            'Add it to backend/.env to enable HuggingFace AI summaries.'
        )
    if not endpoint:
        raise RuntimeError(
            'HUGGINGFACE_ENDPOINT_URL is not set. '
            'Add it to backend/.env to enable HuggingFace AI summaries.'
        )

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }

    if _is_openai_compatible():
        return _call_openai_compat(endpoint, headers, prompt, timeout)
    return _call_raw_text_gen(endpoint, headers, prompt, timeout)


def _call_openai_compat(base_url: str, headers: dict, prompt: str, timeout: float) -> str:
    """HF dedicated endpoint — OpenAI-compatible chat completions."""
    url = f'{base_url.rstrip("/")}/v1/chat/completions'
    payload = {
        'model': settings.huggingface_model_name or 'tgi',
        'messages': [{'role': 'user', 'content': prompt}],
        'max_tokens': 1024,
        'temperature': 0.3,
    }
    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        return data['choices'][0]['message']['content']
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500]
        raise RuntimeError(f'HuggingFace HTTP {e.response.status_code}: {body}') from e
    except Exception as e:
        raise RuntimeError(f'HuggingFace request failed: {e}') from e


def _call_raw_text_gen(endpoint: str, headers: dict, prompt: str, timeout: float) -> str:
    """HF Inference API — raw text-generation format."""
    payload = {
        'inputs': prompt,
        'parameters': {
            'max_new_tokens': 1024,
            'temperature': 0.3,
            'return_full_text': False,
        },
    }
    try:
        resp = httpx.post(endpoint, json=payload, headers=headers, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and data:
            return data[0].get('generated_text', '')
        if isinstance(data, dict):
            return data.get('generated_text', str(data))
        return str(data)
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500]
        raise RuntimeError(f'HuggingFace HTTP {e.response.status_code}: {body}') from e
    except Exception as e:
        raise RuntimeError(f'HuggingFace request failed: {e}') from e
