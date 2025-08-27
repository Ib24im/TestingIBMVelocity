import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./todos.db"
    secret_key: str = "your-super-secret-key-change-this-in-production-please"
    access_token_expire_minutes: int = 30
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
