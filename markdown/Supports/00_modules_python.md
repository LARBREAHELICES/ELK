# Module Python Elasticsearch : prise en main guidée

Ce support vous permet de prendre en main le module Python avec un jeu de données simple, puis d'aller vers des cas plus analytiques.

---

# Installer la librairie

```bash
pip install elasticsearch
```

---

# Connexion à Elasticsearch

```python
from elasticsearch import Elasticsearch

es = Elasticsearch("http://localhost:9200", request_timeout=30)
print(es.info()["version"]["number"])
```

Si la version s'affiche, vous êtes prêt à exécuter les exemples suivants.

---

# Créer un index de travail

```python
index_name = "films_lab"

if es.indices.exists(index=index_name):
    es.indices.delete(index=index_name)

es.indices.create(
    index=index_name,
    mappings={
        "properties": {
            "title": {
                "type": "text",
                "fields": {"keyword": {"type": "keyword"}}
            },
            "summary": {"type": "text"},
            "genre": {"type": "keyword"},
            "year": {"type": "integer"},
            "rating": {"type": "float"},
            "duration_min": {"type": "integer"}
        }
    }
)
```

---

# Indexer plusieurs documents (bulk)

```python
from elasticsearch.helpers import bulk

actions = [
    {"_index": "films_lab", "_id": 1, "_source": {
        "title": "Interstellar",
        "summary": "A team travels through a wormhole to save humanity.",
        "genre": "Sci-Fi",
        "year": 2014,
        "rating": 8.7,
        "duration_min": 169
    }},
    {"_index": "films_lab", "_id": 2, "_source": {
        "title": "Blade Runner 2049",
        "summary": "A new blade runner discovers a buried secret.",
        "genre": "Sci-Fi",
        "year": 2017,
        "rating": 8.0,
        "duration_min": 164
    }},
    {"_index": "films_lab", "_id": 3, "_source": {
        "title": "The Dark Knight",
        "summary": "Batman faces a chaotic criminal mastermind.",
        "genre": "Action",
        "year": 2008,
        "rating": 9.0,
        "duration_min": 152
    }},
    {"_index": "films_lab", "_id": 4, "_source": {
        "title": "Arrival",
        "summary": "A linguist works with the military to understand alien signals.",
        "genre": "Sci-Fi",
        "year": 2016,
        "rating": 7.9,
        "duration_min": 116
    }},
    {"_index": "films_lab", "_id": 5, "_source": {
        "title": "Whiplash",
        "summary": "A young drummer pushes himself under a demanding teacher.",
        "genre": "Drama",
        "year": 2014,
        "rating": 8.5,
        "duration_min": 107
    }},
]

bulk(es, actions)
es.indices.refresh(index="films_lab")
```

---

# Exemple 1 : agrégation (groupe + moyenne)

```python
res = es.search(
    index="films_lab",
    size=0,
    aggs={
        "by_genre": {
            "terms": {"field": "genre"},
            "aggs": {
                "avg_rating": {"avg": {"field": "rating"}},
                "avg_duration": {"avg": {"field": "duration_min"}}
            }
        }
    }
)

for bucket in res["aggregations"]["by_genre"]["buckets"]:
    print(
        bucket["key"],
        "count=", bucket["doc_count"],
        "avg_rating=", round(bucket["avg_rating"]["value"], 2),
        "avg_duration=", round(bucket["avg_duration"]["value"], 1)
    )
```

Vous obtenez un premier indicateur analytique directement côté Elasticsearch.

---

# Exemple 2 : tokenizer (découpage brut du texte)

```python
text = "L'analyse full-text d'Elasticsearch est rapide et efficace."

tokens_standard = es.indices.analyze(
    tokenizer="standard",
    text=text
)

tokens_whitespace = es.indices.analyze(
    tokenizer="whitespace",
    text=text
)

print("standard :", [t["token"] for t in tokens_standard["tokens"]])
print("whitespace :", [t["token"] for t in tokens_whitespace["tokens"]])
```

Vous voyez ici que le tokenizer change fortement la manière dont le texte sera indexé.

---

# Exemple 3 : analyzer (tokenizer + filtres)

```python
text = "Les utilisateurs recherchent rapidement des informations pertinentes."

std = es.indices.analyze(
    analyzer="standard",
    text=text
)

fr = es.indices.analyze(
    analyzer="french",
    text=text
)

print("standard :", [t["token"] for t in std["tokens"]])
print("french   :", [t["token"] for t in fr["tokens"]])
```

Avec `french`, vous constatez en général moins de bruit lexical (stopwords/stemming).

---

# Exemple 4 : requête complexe

```python
query = {
    "bool": {
        "must": [
            {
                "multi_match": {
                    "query": "humanity space signal",
                    "fields": ["title^3", "summary"]
                }
            }
        ],
        "filter": [
            {"range": {"year": {"gte": 2000}}},
            {"range": {"rating": {"gte": 7.5}}}
        ],
        "must_not": [
            {"term": {"genre": "Horror"}}
        ],
        "should": [
            {"term": {"genre": "Sci-Fi"}},
            {"range": {"duration_min": {"lte": 130}}}
        ],
        "minimum_should_match": 1
    }
}

res = es.search(
    index="films_lab",
    query=query,
    sort=[{"rating": {"order": "desc"}}, {"year": {"order": "desc"}}]
)

for hit in res["hits"]["hits"]:
    src = hit["_source"]
    print(hit["_score"], src["title"], src["genre"], src["rating"])
```

Cette structure reproduit un cas réel : texte + contraintes métier + tri final.

---

# Variante utile : requête complexe + agrégation

```python
res = es.search(
    index="films_lab",
    size=0,
    query=query,
    aggs={
        "genre_breakdown": {
            "terms": {"field": "genre"},
            "aggs": {"avg_rating": {"avg": {"field": "rating"}}}
        }
    }
)

print(res["aggregations"]["genre_breakdown"]["buckets"])
```

Vous combinez en une seule requête : sélection des documents + indicateurs.

---

# Tableau récapitulatif du module

| Objectif                   | API Python |
| -------------------------- | ---------- |
| créer/supprimer un index   | `es.indices.create/delete` |
| indexer en masse           | `bulk()` |
| requête full-text          | `es.search(query=...)` |
| agrégation                 | `es.search(aggs=...)` |
| tester tokenizer/analyzer  | `es.indices.analyze(...)` |
| requête bool complexe      | `must/filter/should/must_not` |

---

# Routine de vérification rapide

Avant de passer aux notebooks complets, vérifiez systématiquement :

1. Le cluster répond (`es.info()`).
2. L'index existe (`es.indices.exists(...)`).
3. Les données sont présentes (`es.count(index=...)`).
4. Les analyses texte donnent les tokens attendus (`es.indices.analyze(...)`).
5. Les agrégations retournent des valeurs cohérentes.
