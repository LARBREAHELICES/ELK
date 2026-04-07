from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    elasticsearch_url: str = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    elasticsearch_index: str = os.getenv("ELASTICSEARCH_INDEX", "tmdb-movies")
    cors_allow_origins: str = os.getenv("APP_CORS_ALLOW_ORIGINS", "*")


def get_settings() -> Settings:
    return Settings()
