
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str

    CLERK_WEBHOOK_SIGNING_SECRET: str
    CLERK_JWKS_URL: str
    CLERK_SECRET_KEY: str
    CLERK_ISSUER: str
    CLERK_JWKS_PUBLIC_KEY: str | None
    # redis_url: str
    # clerk_secret_key: str
    # clerk_publishable_key: str
    # openai_api_key: str
    # anthropic_api_key: str
    # aws_bucket_name: str
    # aws_access_key_id: str
    # aws_secret_access_key: str
    # aws_region: str = "us-east-1"

    class Config:
        env_file="../.env"


settings = Settings()
print(type(settings.database_url))