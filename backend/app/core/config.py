from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    app_name: str = "DClaw Assets"
    app_env: str = "dev"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_assets"

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60

    # AI Copilot — Ollama local (primary), OpenRouter cloud (fallback)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    openrouter_api_key: str = ""
    openrouter_model: str = "meta-llama/llama-3.1-8b-instruct:free"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
