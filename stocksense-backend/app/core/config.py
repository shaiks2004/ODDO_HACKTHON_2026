"""Application settings loaded from environment variables."""

from uuid import UUID

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the StockSense API."""

    database_url: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    otp_expire_minutes: int = 10
    stocksense_system_user_id: UUID | None = None
    stocksense_alert_webhook_url: str | None = None
    auth_rate_limit: str = "5/minute"
    cors_allowed_origins: str = ""
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_allowed_origins")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if "*" in origins:
            raise ValueError("CORS_ALLOWED_ORIGINS must list explicit origins; wildcard is not allowed")
        return ",".join(origins)

    @field_validator("stocksense_system_user_id", mode="before")
    @classmethod
    def normalize_optional_system_user_id(cls, value):
        return None if value == "" else value

    @property
    def allowed_cors_origins(self) -> list[str]:
        configured = [origin.strip().rstrip("/") for origin in self.cors_allowed_origins.split(",") if origin.strip()]
        if configured:
            return configured
        if self.environment.lower() in {"development", "dev", "local"}:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return []


settings = Settings()
