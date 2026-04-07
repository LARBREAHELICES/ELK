from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .elasticsearch_service import health, search_movies, suggest_titles
from .schemas import FacetBucket, HealthResponse, MovieHit, SearchFacets, SearchResponse, SuggestResponse

settings = get_settings()

app = FastAPI(
    title="Films Search API",
    version="1.0.0",
    description="API FastAPI de recherche films (Elasticsearch)",
)

allow_origins = ["*"] if settings.cors_allow_origins.strip() == "*" else [
    origin.strip() for origin in settings.cors_allow_origins.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok", elasticsearch=health())


@app.get("/search", response_model=SearchResponse)
def get_search(
    q: str | None = Query(default=None, description="Texte de recherche"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=50),
    sort: str = Query(default="relevance", pattern="^(relevance|rating_desc|popularity_desc|newest)$"),
    language: str | None = Query(default=None),
    min_rating: float | None = Query(default=None, ge=0, le=10),
    year_from: int | None = Query(default=None, ge=1900, le=2100),
    year_to: int | None = Query(default=None, ge=1900, le=2100),
) -> SearchResponse:
    response = search_movies(
        q=q,
        page=page,
        size=size,
        sort=sort,
        language=language,
        min_rating=min_rating,
        year_from=year_from,
        year_to=year_to,
    )

    total = int(((response.get("hits") or {}).get("total") or {}).get("value", 0))
    took = int(response.get("took", 0))

    items = [
        MovieHit(
            id=hit.get("_id"),
            score=hit.get("_score"),
            title=(hit.get("_source") or {}).get("title"),
            overview=(hit.get("_source") or {}).get("overview"),
            original_language=(hit.get("_source") or {}).get("original_language"),
            release_date=(hit.get("_source") or {}).get("release_date"),
            vote_average=(hit.get("_source") or {}).get("vote_average"),
            vote_count=(hit.get("_source") or {}).get("vote_count"),
            popularity=(hit.get("_source") or {}).get("popularity"),
        )
        for hit in (response.get("hits") or {}).get("hits", [])
    ]

    language_buckets = [
        FacetBucket(key=str(bucket.get("key")), count=int(bucket.get("doc_count", 0)))
        for bucket in (((response.get("aggregations") or {}).get("languages") or {}).get("buckets") or [])
    ]

    return SearchResponse(
        total=total,
        page=page,
        size=size,
        took_ms=took,
        items=items,
        facets=SearchFacets(languages=language_buckets),
    )


@app.get("/suggest", response_model=SuggestResponse)
def get_suggest(
    q: str = Query(min_length=1),
    limit: int = Query(default=8, ge=1, le=20),
) -> SuggestResponse:
    return SuggestResponse(suggestions=suggest_titles(q=q, limit=limit))
