from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class MovieHit(BaseModel):
    id: str | None
    score: float | None
    title: str | None
    overview: str | None
    original_language: str | None
    release_date: str | None
    vote_average: float | None
    vote_count: int | None
    popularity: float | None


class FacetBucket(BaseModel):
    key: str
    count: int


class SearchFacets(BaseModel):
    languages: list[FacetBucket]


class SearchResponse(BaseModel):
    total: int
    page: int
    size: int
    took_ms: int
    items: list[MovieHit]
    facets: SearchFacets


class SuggestResponse(BaseModel):
    suggestions: list[str]


class HealthResponse(BaseModel):
    status: str
    elasticsearch: dict[str, Any]
