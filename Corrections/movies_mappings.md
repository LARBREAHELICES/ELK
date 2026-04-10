# Correction — Mappings Elasticsearch pour `movies.csv`

Source analysée : `DATA/archive.zip` -> `movies.csv` (20 colonnes).

Ce fichier propose :
1. un index brut `movies_raw` (audit / debug),
2. un index propre `movies_clean` (recherche + analytics + Kibana).

---

## 1) Mapping `movies_raw` (brut)

```json
PUT movies_raw
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "dynamic": true,
    "properties": {
      "id": { "type": "long" },
      "title": { "type": "text" },
      "genres": { "type": "text" },
      "original_language": { "type": "keyword" },
      "overview": { "type": "text" },
      "popularity": { "type": "float" },
      "production_companies": { "type": "text" },
      "release_date": { "type": "date", "format": "yyyy-MM-dd||strict_date_optional_time" },
      "budget": { "type": "double" },
      "revenue": { "type": "double" },
      "runtime": { "type": "float" },
      "status": { "type": "keyword" },
      "tagline": { "type": "text" },
      "vote_average": { "type": "float" },
      "vote_count": { "type": "float" },
      "credits": { "type": "text" },
      "keywords": { "type": "text" },
      "poster_path": { "type": "keyword" },
      "backdrop_path": { "type": "keyword" },
      "recommendations": { "type": "text" }
    }
  }
}
```

---

## 2) Mapping `movies_clean` (nettoyé)

Hypothèse de nettoyage Logstash :
- `genres`, `production_companies`, `credits`, `keywords` sont split en tableaux,
- `recommendations` est split puis converti en tableau de `long`,
- conversions numériques et date appliquées.

```json
PUT movies_clean
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "normalizer": {
        "lowercase_normalizer": {
          "type": "custom",
          "filter": ["lowercase", "asciifolding"]
        }
      },
      "analyzer": {
        "movie_text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "dynamic": false,
    "properties": {
      "id": { "type": "long" },
      "title": {
        "type": "text",
        "analyzer": "movie_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 512 }
        }
      },
      "genres": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "original_language": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "overview": {
        "type": "text",
        "analyzer": "movie_text_analyzer"
      },
      "popularity": { "type": "float" },
      "production_companies": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "release_date": {
        "type": "date",
        "format": "yyyy-MM-dd||strict_date_optional_time"
      },
      "budget": { "type": "double" },
      "revenue": { "type": "double" },
      "runtime": { "type": "float" },
      "status": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "tagline": {
        "type": "text",
        "analyzer": "movie_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 512 }
        }
      },
      "vote_average": { "type": "float" },
      "vote_count": { "type": "integer" },
      "credits": {
        "type": "text",
        "analyzer": "movie_text_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 512 }
        }
      },
      "keywords": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "poster_path": { "type": "keyword" },
      "backdrop_path": { "type": "keyword" },
      "recommendations": { "type": "long" }
    }
  }
}
```

---

## 3) Vérification rapide

```json
GET movies_clean/_mapping
```

```json
GET movies_clean/_search
{
  "size": 1
}
```

```json
GET movies_clean/_search
{
  "size": 0,
  "aggs": {
    "by_genre": {
      "terms": {
        "field": "genres"
      }
    }
  }
}
```
