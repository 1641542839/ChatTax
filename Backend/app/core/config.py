"""
Configuration settings for the ChatTax Backend application.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "ChatTax Backend"
    app_version: str = "1.0.0"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS - expects JSON array or comma-separated string
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    # Database
    database_url: str = "sqlite:///./chattax.db"

    # JWT Authentication
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # OpenAI (Optional)
    openai_api_key: str | None = None

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string to list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
