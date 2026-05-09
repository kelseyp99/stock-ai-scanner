"""
ai_provider_service.py

Unified dispatcher that routes AI summary requests to either
OpenRouter or HuggingFace based on the requested provider.
Stores each run in ai_summary_runs table.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.models import AiSummaryRun
from . import openrouter_service, huggingface_service
from .market_summary_service import build_market_summary_prompt

logger = logging.getLogger(__name__)

PROVIDER_OPENROUTER = 'openrouter'
PROVIDER_HUGGINGFACE = 'huggingface'


def get_available_models() -> list[dict]:
    """Return all configured AI models across all providers."""
    models = openrouter_service.get_available_models()
    if settings.huggingface_api_key and settings.huggingface_endpoint_url:
        models.append({
            'provider': PROVIDER_HUGGINGFACE,
            'id': settings.huggingface_model_name or 'hf-custom',
            'name': f'HuggingFace — {settings.huggingface_model_name or "Custom Endpoint"}',
        })
    return models


def generate_market_summary(
    scan_results: list[dict],
    news_by_ticker: dict[str, list[dict]],
    provider: str,
    model_id: str | None,
    universe_id: str | None,
    db: Session,
) -> dict:
    """
    Build the prompt, call the AI provider, persist the run, and return the summary.

    Returns a dict with keys: summary, provider, model_id, error, created_at
    """
    prompt = build_market_summary_prompt(scan_results, news_by_ticker, universe_id)

    summary_text = None
    error_msg = None
    prompt_tokens = _rough_token_count(prompt)
    completion_tokens = 0

    try:
        if provider == PROVIDER_HUGGINGFACE:
            summary_text = huggingface_service.call_huggingface_model(prompt)
        else:
            # Default to OpenRouter
            messages = [
                {
                    'role': 'system',
                    'content': (
                        'You are a professional equity research analyst. '
                        'Provide factual, data-driven observations. '
                        'Never give buy/sell recommendations. '
                        'Always remind the user this is for research only, not financial advice.'
                    ),
                },
                {'role': 'user', 'content': prompt},
            ]
            summary_text = openrouter_service.call_openrouter_chat(messages, model_id)

        completion_tokens = _rough_token_count(summary_text or '')
    except RuntimeError as exc:
        error_msg = str(exc)
        logger.error('AI summary generation failed: %s', error_msg)

    # Persist run
    run = AiSummaryRun(
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        provider=provider,
        model_id=model_id or settings.openrouter_default_model,
        universe_id=universe_id,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        summary=summary_text,
        error=error_msg,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        'id': run.id,
        'summary': summary_text,
        'provider': provider,
        'model_id': run.model_id,
        'error': error_msg,
        'created_at': run.created_at.isoformat() if run.created_at else None,
    }


def _rough_token_count(text: str) -> int:
    """Rough approximation: ~4 chars per token."""
    return max(1, len(text) // 4)
