"""
SciPulse — Search Service
Module encapsulant les requêtes Elasticsearch avancées.

Usage :
    from src.search.search_service import SciPulseSearch
    search = SciPulseSearch()
    results = search.full_text("reinforcement learning robotics")
"""

from elasticsearch import Elasticsearch


class SciPulseSearch:
    """Interface de recherche pour le projet SciPulse."""

    def __init__(self, es_host: str = "http://localhost:9200", index: str = "arxiv-papers"):
        self.es = Elasticsearch(es_host)
        self.index = index

    # ── Recherche full-text ──────────────────────────────────────────────

    def full_text(
        self,
        query: str,
        size: int = 10,
        boost_recent: bool = True,
        min_hn_score: int | None = None,
    ) -> dict:
        """
        Recherche multi_match cross-fields sur titre + abstract.
        Optionnel : boost par fraîcheur (function_score + decay gaussien)
                    et filtre sur le score HN.
        """
        must = [
            {
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "abstract"],
                    "type": "cross_fields",
                    "operator": "and",
                }
            }
        ]

        filters = []
        if min_hn_score is not None:
            filters.append({"range": {"hn_score": {"gte": min_hn_score}}})

        bool_query = {"must": must}
        if filters:
            bool_query["filter"] = filters

        if boost_recent:
            body = {
                "query": {
                    "function_score": {
                        "query": {"bool": bool_query},
                        "functions": [
                            {
                                "gauss": {
                                    "date_published": {
                                        "origin": "now",
                                        "scale": "365d",
                                        "decay": 0.5,
                                    }
                                }
                            },
                            {
                                "field_value_factor": {
                                    "field": "hn_score",
                                    "factor": 1.2,
                                    "modifier": "log1p",
                                    "missing": 0,
                                }
                            },
                        ],
                        "boost_mode": "multiply",
                    }
                },
                "highlight": {
                    "fields": {
                        "abstract": {"fragment_size": 200, "number_of_fragments": 3},
                        "title": {},
                    },
                    "pre_tags": ["<mark>"],
                    "post_tags": ["</mark>"],
                },
                "size": size,
            }
        else:
            body = {
                "query": {"bool": bool_query},
                "highlight": {
                    "fields": {"abstract": {"fragment_size": 200}, "title": {}},
                    "pre_tags": ["<mark>"],
                    "post_tags": ["</mark>"],
                },
                "size": size,
            }

        return self.es.search(index=self.index, body=body)

    # ── More Like This ───────────────────────────────────────────────────

    def more_like_this(self, arxiv_id: str, size: int = 10) -> dict:
        """Trouve les articles les plus similaires à un article donné."""
        body = {
            "query": {
                "more_like_this": {
                    "fields": ["title", "abstract"],
                    "like": [{"_index": self.index, "_id": arxiv_id}],
                    "min_term_freq": 1,
                    "max_query_terms": 25,
                    "min_doc_freq": 2,
                }
            },
            "size": size,
        }
        return self.es.search(index=self.index, body=body)

    # ── Significant Terms ────────────────────────────────────────────────

    def significant_terms(
        self,
        category: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        size: int = 20,
    ) -> dict:
        """
        Détecte les termes statistiquement significatifs dans un sous-ensemble.
        Exemple : termes distinguant cs.AI des 3 derniers mois vs. le corpus entier.
        """
        filters = []
        if category:
            filters.append({"term": {"categories": category}})
        if date_from or date_to:
            date_range = {}
            if date_from:
                date_range["gte"] = date_from
            if date_to:
                date_range["lte"] = date_to
            filters.append({"range": {"date_published": date_range}})

        query = {"bool": {"filter": filters}} if filters else {"match_all": {}}

        body = {
            "query": query,
            "size": 0,
            "aggs": {
                "significant_keywords": {
                    "sampler": {"shard_size": 5000},
                    "aggs": {
                        "keywords": {
                            "significant_terms": {
                                "field": "abstract",
                                "size": size,
                                "min_doc_count": 10,
                            }
                        }
                    },
                }
            },
        }
        return self.es.search(index=self.index, body=body)

    # ── Suggestion (did-you-mean) ────────────────────────────────────────

    def suggest(self, text: str) -> dict:
        """Correction de saisie sur le vocabulaire scientifique."""
        body = {
            "suggest": {
                "title_suggest": {
                    "text": text,
                    "phrase": {
                        "field": "title",
                        "size": 3,
                        "gram_size": 3,
                        "direct_generator": [
                            {"field": "title", "suggest_mode": "popular"}
                        ],
                        "highlight": {"pre_tag": "<em>", "post_tag": "</em>"},
                    },
                }
            }
        }
        return self.es.search(index=self.index, body=body)

    # ── Match Phrase avec slop ───────────────────────────────────────────

    def phrase_search(self, phrase: str, slop: int = 2, size: int = 10) -> dict:
        """Recherche de phrase avec tolérance (slop) sur l'ordre des mots."""
        body = {
            "query": {
                "match_phrase": {
                    "abstract": {"query": phrase, "slop": slop}
                }
            },
            "highlight": {
                "fields": {"abstract": {"fragment_size": 250}},
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"],
            },
            "size": size,
        }
        return self.es.search(index=self.index, body=body)


if __name__ == "__main__":
    # Quick demo
    search = SciPulseSearch()

    print("=== Full-text search ===")
    res = search.full_text("transformer attention mechanism")
    for hit in res["hits"]["hits"][:3]:
        print(f"  [{hit['_score']:.2f}] {hit['_source']['title'][:80]}")

    print("\n=== Suggest ===")
    res = search.suggest("convlutional nueral network")
    for suggestion in res.get("suggest", {}).get("title_suggest", []):
        for option in suggestion.get("options", []):
            print(f"  → {option['text']}")
