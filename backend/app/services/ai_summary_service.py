"""
ai_summary_service.py — Placeholder for AI-generated scan summaries.

Currently generates a plain-English summary without calling any AI API.
Structured so an OpenAI / Ollama call can be dropped in later by replacing
the body of generate_scan_summary().
"""

from typing import List


def generate_scan_summary(scan_results: list) -> str:
    """
    Generate a plain-English summary of scan results.

    Args:
        scan_results: List of scan result dicts from scan_ticker()

    Returns:
        A human-readable summary string.

    TODO: Replace the body below with an OpenAI / Ollama call when ready.
    Example future integration:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": _build_prompt(scan_results)}]
        )
        return response.choices[0].message.content
    """
    if not scan_results:
        return "Today's scan found no notable stocks."

    total = len(scan_results)
    sorted_results = sorted(scan_results, key=lambda x: -x.get('score', 0))

    # Top momentum names (RSI > 65 or price above MAs)
    momentum = [r['ticker'] for r in sorted_results if 'Momentum' in r.get('categories', [])][:3]
    # Oversold names
    oversold = [r['ticker'] for r in sorted_results if 'Oversold' in r.get('categories', [])][:3]
    # High / Extreme volatility
    volatile = [r['ticker'] for r in sorted_results
                if any(c in r.get('categories', []) for c in ['High Volatility', 'Extreme Volatility'])][:3]
    # Dividend plays
    dividend = [r['ticker'] for r in sorted_results if 'Dividend' in r.get('categories', [])][:3]
    # Breakout volume
    breakout = [r['ticker'] for r in sorted_results if 'Breakout Volume' in r.get('categories', [])][:3]
    # Weak trend
    weak = [r['ticker'] for r in sorted_results if 'Weak Trend' in r.get('categories', [])][:3]
    # MA convergence signals
    bullish_cross = [r['ticker'] for r in sorted_results if 'Bullish Crossover Setup' in r.get('categories', [])][:3]
    bearish_cross = [r['ticker'] for r in sorted_results if 'Bearish Crossover Risk' in r.get('categories', [])][:3]
    ma_conv       = [r['ticker'] for r in sorted_results if 'MA Converging' in r.get('categories', [])][:3]
    # Market leaders / laggards
    leaders  = [r['ticker'] for r in sorted_results if 'Market Leader'  in r.get('categories', [])][:3]
    laggards = [r['ticker'] for r in sorted_results if 'Market Laggard' in r.get('categories', [])][:3]

    lines = [f"Today's scan found {total} notable stocks."]

    if momentum:
        lines.append(f"Strongest momentum names: {', '.join(momentum)}.")
    if oversold:
        lines.append(f"Oversold / potential bounce candidates: {', '.join(oversold)}.")
    if breakout:
        lines.append(f"Volume breakout signals: {', '.join(breakout)}.")
    if bullish_cross:
        lines.append(f"Bullish MA crossover setups (MA20 approaching MA50 from below): {', '.join(bullish_cross)}.")
    if bearish_cross:
        lines.append(f"Bearish crossover risk (MA20 approaching MA50 from above): {', '.join(bearish_cross)}.")
    if ma_conv:
        lines.append(f"Moving averages converging (watch for breakout): {', '.join(ma_conv)}.")
    if leaders:
        lines.append(f"Market leaders vs SPY: {', '.join(leaders)}.")
    if laggards:
        lines.append(f"Underperforming vs SPY: {', '.join(laggards)}.")
    if dividend:
        lines.append(f"Dividend yield opportunities: {', '.join(dividend)}.")
    if volatile:
        lines.append(f"Highest volatility names: {', '.join(volatile)}.")
    if weak:
        lines.append(f"Weak trend / caution: {', '.join(weak)}.")

    top3 = [r['ticker'] for r in sorted_results[:3]]
    if top3:
        lines.append(f"Top overall picks by score: {', '.join(top3)}.")

    return ' '.join(lines)


def _build_prompt(scan_results: list) -> str:
    """
    Helper to build a structured prompt for future AI API calls.
    Not used yet — placeholder for OpenAI/Ollama integration.
    """
    lines = ["You are a financial analyst. Summarize the following stock scan results in plain English.\n"]
    for r in scan_results[:20]:  # limit token usage
        lines.append(
            f"{r['ticker']}: price={r.get('price')}, RSI={r.get('rsi')}, "
            f"score={r.get('score')}, categories={r.get('categories')}, "
            f"reasons={r.get('reasons')}"
        )
    lines.append("\nProvide a concise 3-5 sentence summary suitable for a daily briefing.")
    return '\n'.join(lines)
