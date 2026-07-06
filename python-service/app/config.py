from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LongCat API
    LONGCAT_API_KEY: str = ""
    LONGCAT_BASE_URL: str = "https://api.longcat.chat/v1"
    LONGCAT_MODEL: str = "LongCat-2.0"

    # Service
    SERVICE_HOST: str = "0.0.0.0"
    SERVICE_PORT: int = 8000

    # PostgreSQL (optional)
    DATABASE_URL: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
