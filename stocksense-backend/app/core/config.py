"""Application settings loaded from environment variables."""

from uuid import UUID
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the StockSense API."""

    database_url: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    otp_expire_minutes: int = 10
    stocksense_system_user_id: UUID | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
