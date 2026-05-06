from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "DClaw Assets"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dclaw_assets"
    cors_origins: str = "*"

    class Config:
        env_prefix = "ASSETS_"

settings = Settings()
