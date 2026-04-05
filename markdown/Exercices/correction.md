# Correction — Exercice 01 (Cours `02_requetes`)

## Pré-requis Jupyter

```python
import requests
import json

ES_URL = "http://elasticsearch:9200"

def run_search(query, index="shakespeare_extended"):
    resp = requests.get(f"{ES_URL}/{index}/_search", json=query)
    data = resp.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
    return data
```

---

## Exercice 1 — Mapping et types

- `text` : `text_entry`
- `keyword` : `play_name`, `speaker`
- numériques : `act`, `scene`, `year`

```json
GET shakespeare_extended/_search
{
  "query": {
    "match": {
      "text_entry": "question"
    }
  }
}
```

```json
GET shakespeare_extended/_search
{
  "query": {
    "term": {
      "play_name": "Hamlet"
    }
  }
}
```

```python
run_search({"query": {"match": {"text_entry": "question"}}})
run_search({"query": {"term": {"play_name": "Hamlet"}}})
```

---

## Exercice 2 — `match` et score

- Le document qui contient le plus de termes de la requête remonte en premier.
- `_score` représente la pertinence.

```json
GET shakespeare_extended/_search
{
  "query": {
    "match": {
      "text_entry": "to be question"
    }
  }
}
```

```python
run_search({"query": {"match": {"text_entry": "to be question"}}})
```

---

## Exercice 3 — `must` + `filter`

- `must` : recherche obligatoire, participe au score.
- `filter` : contrainte obligatoire, sans impact sur le score.

```json
GET shakespeare_extended/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "be" } }
      ],
      "filter": [
        { "term": { "play_name": "Hamlet" } }
      ]
    }
  }
}
```

```python
run_search({
  "query": {
    "bool": {
      "must": [{"match": {"text_entry": "be"}}],
      "filter": [{"term": {"play_name": "Hamlet"}}]
    }
  }
})
```

---

## Exercice 4 — `should`

- `should` : logique OR et/ou boost.
- `minimum_should_match: 1` : au moins une clause `should`.
- `minimum_should_match: 2` : deux clauses `should` obligatoires.

```json
GET shakespeare_extended/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "love" } }
      ],
      "should": [
        { "term": { "speaker": "HAMLET" } },
        { "term": { "speaker": "OTHELLO" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

```python
run_search({
  "query": {
    "bool": {
      "must": [{"match": {"text_entry": "love"}}],
      "should": [
        {"term": {"speaker": "HAMLET"}},
        {"term": {"speaker": "OTHELLO"}}
      ],
      "minimum_should_match": 1
    }
  }
})
```

---

## Exercice 5 — `range`

- `gte` = `>=`
- `lte` = `<=`

```json
GET shakespeare_extended/_search
{
  "query": {
    "range": {
      "year": {
        "gte": 1603,
        "lte": 1605
      }
    }
  },
  "sort": [
    { "year": "asc" }
  ]
}
```

```python
run_search({
  "query": {
    "range": {"year": {"gte": 1603, "lte": 1605}}
  },
  "sort": [{"year": "asc"}]
})
```

---

## Exercice 6 — `_analyze`

- Les tokens dépendent de l’analyzer du champ.
- Les tokens sont créés à l’indexation et réutilisés à la recherche `match`.

```json
POST shakespeare_extended/_analyze
{
  "field": "text_entry",
  "text": "To be or not to be that is the question"
}
```

```python
resp = requests.post(
    f"{ES_URL}/shakespeare_extended/_analyze",
    json={
        "field": "text_entry",
        "text": "To be or not to be that is the question"
    },
)
print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
```

---

## Exercice 7 — Requête complète

- recherche : `must`
- filtre : `filter`
- score / préférence : `should`

```json
GET shakespeare_extended/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "text_entry": "be" } }
      ],
      "filter": [
        { "term": { "play_name": "Hamlet" } },
        { "range": { "year": { "gte": 1600 } } }
      ],
      "should": [
        { "term": { "speaker": "HAMLET" } }
      ]
    }
  }
}
```

```python
run_search({
  "query": {
    "bool": {
      "must": [{"match": {"text_entry": "be"}}],
      "filter": [
        {"term": {"play_name": "Hamlet"}},
        {"range": {"year": {"gte": 1600}}}
      ],
      "should": [{"term": {"speaker": "HAMLET"}}]
    }
  }
})
```

---

## Exercice final — Synthèse

| Élément | Rôle |
| --- | --- |
| `match` | recherche full-text |
| `term` | recherche exacte |
| `must` | condition obligatoire avec score |
| `filter` | condition obligatoire sans score |
| `should` | préférence / OR selon `minimum_should_match` |
| `tokens` | unités de texte issues de l’analyse |
| `index inversé` | structure terme -> documents |

---

## Exercice 8 — `multi_match` avec boost

- Rechercher `ghost` dans plusieurs champs.
- Donner plus de poids au champ `speaker` avec `speaker^2`.

```json
GET shakespeare/_search
{
  "query": {
    "multi_match": {
      "query": "ghost",
      "fields": ["text_entry", "play_name", "speaker^2"]
    }
  }
}
```

```python
run_search({
  "query": {
    "multi_match": {
      "query": "ghost",
      "fields": ["text_entry", "play_name", "speaker^2"]
    }
  }
}, index="shakespeare")
```

---

## Exercice 9 — `multi_match` + filtre

- Rechercher `love` dans `text_entry` et `play_name`.
- Filtrer uniquement la pièce `Hamlet`.

```json
GET shakespeare/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "love",
            "fields": ["text_entry", "play_name"]
          }
        }
      ],
      "filter": [
        {
          "term": {
            "play_name.keyword": "Hamlet"
          }
        }
      ]
    }
  }
}
```

```python
run_search({
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "love",
            "fields": ["text_entry", "play_name"]
          }
        }
      ],
      "filter": [
        {
          "term": {
            "play_name.keyword": "Hamlet"
          }
        }
      ]
    }
  }
}, index="shakespeare")
```
