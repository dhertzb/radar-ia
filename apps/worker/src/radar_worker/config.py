from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    api_url: str = "http://localhost:3001/v1"
    ingest_token: str = "local-ingest-token"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    worker_mode: str = "live"
    market_data_provider: str = "disabled"
    news_rss_urls: str = ""
    sec_user_agent: str = "Radar IA contato@example.com"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
