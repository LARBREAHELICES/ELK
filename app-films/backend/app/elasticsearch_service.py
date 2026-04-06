from __future__ import annotations

from functools import lru_cache
from typing import Any

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError

from .config import get_settings


SORTS: dict[str, list[dict[str, Any]]] = {
    "relevance": [{"_score": "desc"}, {"vote_count": "desc"}],
    "rating_desc": [{"vote_average": "desc"}, {"vote_count": "desc"}],
    "popularity_desc": [{"popularity": "desc"}, {"vote_count": "desc"}],
    "newest": [{"release_date_ts": "desc"}, {"vote_count": "desc"}],
}


@lru_cache(maxsize=1)
def get_es_client() -> Elasticsearch:
    settings = get_settings()
    return Elasticsearch(settings.elasticsearch_url)


def _build_filters(
    language: str | None,
    min_rating: float | None,
    year_from: int | None,
    year_to: int | None,
) -> list[dict[str, Any]]:
    filters: list[dict[str, Any]] = []

    if language:
        filters.append({"term": {"original_language.keyword": language}})

    if min_rating is not None:
        filters.append({"range": {"vote_average": {"gte": min_rating}}})

    if year_from is not None or year_to is not None:
        date_range: dict[str, str] = {}
        if year_from is not None:
            date_range["gte"] = f"{year_from}-01-01"
        if year_to is not None:
            date_range["lte"] = f"{year_to}-12-31"
        filters.append({"range": {"release_date_ts": date_range}})

    return filters


def _build_query(
    q: str | None,
    language: str | None,
    min_rating: float | None,
    year_from: int | None,
    year_to: int | None,
) -> dict[str, Any]:
    query_text = (q or "").strip()
    must: list[dict[str, Any]]

    if query_text:
        must = [
            {
                "multi_match": {
                    "query": query_text,
                    "fields": ["title^4", "overview^2", "original_language"],
                    "fuzziness": "AUTO",
                    "operator": "and",
                }
            }
        ]
    else:
        must = [{"match_all": {}}]

    filters = _build_filters(language, min_rating, year_from, year_to)

    return {
        "bool": {
            "must": must,
            "filter": filters,
        }
    }


def search_movies(
    *,
    q: str | None,
    page: int,
    size: int,
    sort: str,
    language: str | None,
    min_rating: float | None,
    year_from: int | None,
    year_to: int | None,
) -> dict[str, Any]:
    settings = get_settings()
    es = get_es_client()

    query = _build_query(q, language, min_rating, year_from, year_to)

    start = (page - 1) * size
    sorts = SORTS.get(sort, SORTS["relevance"])

    body = {
        "from": start,
        "size": size,
        "sort": sorts,
        "query": query,
        "aggs": {
            "languages": {
                "terms": {
                    "field": "original_language.keyword",
                    "size": 12,
                }
            }
        },
        "_source": [
            "title",
            "overview",
            "original_language",
            "release_date",
            "vote_average",
            "vote_count",
            "popularity",
        ],
    }

    try:
        return es.search(index=settings.elasticsearch_index, body=body)
    except NotFoundError:
        return {
            "took": 0,
            "hits": {"total": {"value": 0}, "hits": []},
            "aggregations": {"languages": {"buckets": []}},
        }


def suggest_titles(q: str, limit: int = 8) -> list[str]:
    settings = get_settings()
    es = get_es_client()

    query_text = q.strip()
    if not query_text:
        return []

    body = {
        "size": limit,
        "query": {
            "match_phrase_prefix": {
                "title": {
                    "query": query_text,
                }
            }
        },
        "_source": ["title"],
    }

    try:
        response = es.search(index=settings.elasticsearch_index, body=body)
    except NotFoundError:
        return []

    titles: list[str] = []
    seen: set[str] = set()

    for hit in response.get("hits", {}).get("hits", []):
        title = (hit.get("_source") or {}).get("title")
        if title and title not in seen:
            seen.add(title)
            titles.append(title)

    return titles


def health() -> dict[str, Any]:
    es = get_es_client()
    info = es.info()
    return {
        "name": info.get("name"),
        "cluster_name": info.get("cluster_name"),
        "version": (info.get("version") or {}).get("number"),
        "tagline": info.get("tagline"),
    }
