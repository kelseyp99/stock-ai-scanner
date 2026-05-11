from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str

    # OpenRouter
    openrouter_api_key: str = ''
    openrouter_base_url: str = 'https://openrouter.ai/api/v1'
    openrouter_default_model: str = 'openai/gpt-4o'
    openrouter_model_gpt4: str = 'openai/gpt-4'
    openrouter_model_gpt55: str = 'openai/gpt-5'
    openrouter_model_sonnet46: str = 'anthropic/claude-sonnet-4-5'
    openrouter_model_opus47: str = 'anthropic/claude-opus-4-5'
    openrouter_http_referer: str = ''
    openrouter_app_title: str = 'stock-ai-scanner'

    # Hugging Face
    huggingface_api_key: str = ''
    huggingface_endpoint_url: str = ''
    huggingface_model_name: str = ''

    # News
    news_lookback_days: int = 3

    # Scheduler
    scheduler_enabled: bool = True
    default_scan_time: str = '02:00'
    default_timezone: str = 'America/New_York'
    max_concurrent_scheduled_scans: int = 1

    # DataImpulse proxy (optional — for failed-ticker retries)
    dataimpulse_user: str = ''
    dataimpulse_pass: str = ''
    dataimpulse_host: str = 'gw.dataimpulse.com'
    dataimpulse_port: int  = 823

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'


settings = Settings()
