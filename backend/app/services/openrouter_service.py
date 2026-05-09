"""
openrouter_service.py

Calls the OpenRouter API (OpenAI-compatible Chat Completions endpoint).
All model IDs and keys come from environment variables — nothing is hardcoded.
"""

import logging
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)


def get_available_models() -> list[dict]:
    """Return the list of configured OpenRouter model choices."""
    return [
        {'provider': 'openrouter', 'id': settings.openrouter_model_gpt4,    'name': 'GPT-4 (OpenRouter)'},
        {'provider': 'openrouter', 'id': settings.openrouter_model_gpt55,   'name': 'GPT-5 (OpenRouter)'},
        {'provider': 'openrouter', 'id': settings.openrouter_model_sonnet46, 'name': 'Claude Sonnet 4.5 (OpenRouter)'},
        {'provider': 'openrouter', 'id': settings.openrouter_model_opus47,   'name': 'Claude Opus 4.5 (OpenRouter)'},
    ]


def call_openrouter_chat(messages: list[dict], model_id: str | None = None,
                         timeout: float = 60.0) -> str:
    """
    Send a chat completion request to OpenRouter.

    Args:
        messages:  Standard OpenAI messages list [{"role": ..., "content": ...}]
        model_id:  OpenRouter model string. Falls back to OPENROUTER_DEFAULT_MODEL.
        timeout:   HTTP timeout in seconds.

    Returns:
        The assistant reply content as a string.

    Raises:
        RuntimeError if the API key is missing or the request fails.
    """
    api_key = settings.openrouter_api_key
    if not api_key:
        raise RuntimeError(
            'OPENROUTER_API_KEY is not set. '
            'Add it to backend/.env to enable AI summaries.'
        )

    model = model_id or settings.openrouter_default_model
    url = f'{settings.openrouter_base_url.rstrip("/")}/chat/completions'

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'X-Title': settings.openrouter_app_title,
    }
    if settings.openrouter_http_referer:
        headers['HTTP-Referer'] = settings.openrouter_http_referer

    payload = {
        'model': model,
        'messages': messages,
    }

    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        return data['choices'][0]['message']['content']
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500]
        raise RuntimeError(f'OpenRouter HTTP {e.response.status_code}: {body}') from e
    except Exception as e:
        raise RuntimeError(f'OpenRouter request failed: {e}') from e
