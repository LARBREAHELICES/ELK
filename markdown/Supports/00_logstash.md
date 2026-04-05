# Logstash avec un dataset films 

## Objectif

Utiliser Logstash pour ingérer un CSV réel de 10 000 films dans Elasticsearch.

Pipeline :

```text
input -> filter -> output
```

---

## Dataset utilisé

Fichier :

`Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv`

Colonnes :
- `index`
- `title`
- `original_language`
- `release_date`
- `popularity`
- `vote_average`
- `vote_count`
- `overview`

---

## Input - lire le CSV

```conf
input {
  file {
    path => "/usr/share/logstash/logs/films/tmdb_movies.csv"
    start_position => "beginning"
    sincedb_path => "/tmp/logstash_tmdb_movies.sincedb"
  }
}
```

---

## Filter - parser et typer

```conf
filter {
  csv {
    separator => ","
    quote_char => '"'
    skip_header => true
    columns => ["index", "title", "original_language", "release_date", "popularity", "vote_average", "vote_count", "overview"]
  }

  mutate {
    rename => { "index" => "movie_id" }
    convert => {
      "movie_id" => "integer"
      "popularity" => "float"
      "vote_average" => "float"
      "vote_count" => "integer"
    }
  }

  date {
    match => ["release_date", "dd-MM-yyyy"]
    target => "release_date_ts"
  }
}
```

---

## Output - indexer dans Elasticsearch

```conf
output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "tmdb-movies"
  }

  stdout { codec => rubydebug }
}
```

---

## Pipeline complet

```conf
input {
  file {
    path => "/usr/share/logstash/logs/films/tmdb_movies.csv"
    start_position => "beginning"
    sincedb_path => "/tmp/logstash_tmdb_movies.sincedb"
  }
}

filter {
  csv {
    separator => ","
    quote_char => '"'
    skip_header => true
    columns => ["index", "title", "original_language", "release_date", "popularity", "vote_average", "vote_count", "overview"]
  }

  mutate {
    rename => { "index" => "movie_id" }
    convert => {
      "movie_id" => "integer"
      "popularity" => "float"
      "vote_average" => "float"
      "vote_count" => "integer"
    }
  }

  date {
    match => ["release_date", "dd-MM-yyyy"]
    target => "release_date_ts"
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "tmdb-movies"
  }
}
```

---

## Vérifications utiles

```bash
curl "http://localhost:9200/tmdb-movies/_count?pretty"
curl "http://localhost:9200/tmdb-movies/_mapping?pretty"
curl "http://localhost:9200/tmdb-movies/_search?pretty&size=3"
```

---

## Exemples d'analyses métier

Top langues :

```json
GET tmdb-movies/_search
{
  "size": 0,
  "aggs": {
    "top_languages": {
      "terms": {
        "field": "original_language.keyword",
        "size": 10
      }
    }
  }
}
```

Top films populaires :

```json
GET tmdb-movies/_search
{
  "size": 10,
  "sort": [{ "popularity": "desc" }],
  "_source": ["title", "popularity", "vote_average", "vote_count"]
}
```

---

## À retenir

- `input` lit le fichier CSV
- `filter` transforme les champs
- `output` envoie vers Elasticsearch
- les types (`float`, `integer`, `date`) sont essentiels pour analyser correctement

---

## Résumé en une phrase

**Logstash permet de transformer un CSV brut (TMDB) en index exploitable pour la recherche et l'analyse dans Elasticsearch.**
