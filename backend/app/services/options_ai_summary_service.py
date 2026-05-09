import logging
from typing import Dict, Any
from ..core.config import settings
from . import openrouter_service, huggingface_service

logger = logging.getLogger(__name__)


def generate_options_summary(ticker: str, chain_data: Dict[str, Any], strategies: list, model: str = None, provider: str = 'openrouter') -> Dict[str, Any]:
    # build prompt
    price = chain_data.get('current_price')
    prompt = (
        f"Provide a concise, probabilistic, non-advisory summary for options on {ticker}.\n"
        f"Current price: {price}.\n"
        f"Include IV vs historical notes, expected move, and rationale for the top recommended strategy.\n"
        f"Strategies:\n"
    )
    for s in strategies[:5]:
        prompt += f"- {s.get('strategy')}: {s.get('description')}\n"
    prompt += "\nRespond in 3-6 bullet points, avoid deterministic language, and include a one-line risk disclaimer."

    try:
        if provider == 'huggingface':
            # huggingface custom endpoint assumed
            text = huggingface_service.call_huggingface_model(prompt)
        else:
            messages = [
                {'role': 'system', 'content': 'You are a professional options strategist. Provide probabilistic, evidence-based summaries. Do not give financial advice.'},
                {'role': 'user', 'content': prompt},
            ]
            text = openrouter_service.call_openrouter_chat(messages, model_id=model)
        return {'provider': provider, 'model': model, 'summary': text}
    except Exception as e:
        logger.exception('options AI summary failed: %s', e)
        return {'provider': provider, 'model': model, 'summary': None, 'error': str(e)}
