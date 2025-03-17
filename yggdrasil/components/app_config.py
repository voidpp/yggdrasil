from pathlib import Path
from yaml import safe_load

from pydantic import BaseModel


class OAuthClient(BaseModel):
    id: str
    secret: str
    metadata_url: str
    icon: str


class ReditConfig(BaseModel):
    client_id: str
    client_secret: str


class AppConfig(BaseModel):
    database_url: str
    redis_url: str
    auth_clients: dict[str, OAuthClient]
    session_secret: str
    reddit: ReditConfig | None = None


def load_app_config(file_path: str):
    file = Path(file_path)

    content = safe_load(file.open())

    config = AppConfig(**content)

    return config
