# Logstash - Cas d'usage TMDB
## Ingestion CSV, typage et analyse metier

---

## Objectif du cours

- Ingerer un CSV reels de 10 000 films TMDB
- Transformer les champs en types exploitables
- Parser les dates de sortie
- Verifier la qualite de l'ingestion dans Elasticsearch
- Produire des requetes metier simples

---

## Dataset utilise

Fichier source :

`Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv`

Colonnes :
- `index`
- `title`
- `original_language`
- `release_date` (format `dd-MM-yyyy`)
- `popularity`
- `vote_average`
- `vote_count`
- `overview`

---

## Preparation du fichier

```bash
mkdir -p logs/films
cp "sandbox/data/Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv" logs/films/tmdb_movies.csv
docker compose restart logstash
```

Ce que fait le code:
- Place le CSV dans le dossier monte dans Logstash
- Redemarre Logstash pour relancer la lecture

---

## Pipeline Logstash (fichier de conf)

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

Ce que fait le code:
- `input file`: lit le CSV TMDB
- `csv`: split les colonnes
- `mutate`: renomme et convertit les types
- `date`: transforme `release_date` en date exploitable
- `output`: indexe dans `tmdb-movies`

---

## Requetes de verification Elasticsearch

```bash
curl "http://localhost:9200/_cat/indices?v"
curl "http://localhost:9200/tmdb-movies/_count?pretty"
curl "http://localhost:9200/tmdb-movies/_mapping?pretty"
curl "http://localhost:9200/tmdb-movies/_search?pretty&size=3"
```

Ce que fait le code:
- Verifie la creation de l'index
- Controle le volume ingere
- Verifie les types de champs
- Lit un echantillon de documents

---

## Requete metier 1 - Top langues

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

Ce que fait la requete:
- Donne les langues les plus presentes dans le dataset

---

## Requete metier 2 - Top films par popularite

```json
GET tmdb-movies/_search
{
  "size": 10,
  "sort": [
    { "popularity": "desc" }
  ],
  "_source": ["title", "popularity", "vote_average", "vote_count"]
}
```

Ce que fait la requete:
- Liste les films les plus populaires
- Affiche les metriques utiles pour interpretation rapide

---

## Qualite de parsing et enrichissement

Points a controler:
- `movie_id` bien en `integer`
- `popularity` et `vote_average` en `float`
- `vote_count` en `integer`
- `release_date_ts` present et exploitable

Enrichissements possibles:
- derive `release_year`
- categoriser `vote_average` (A/B/C)
- normaliser `original_language`

---

## Observabilite runtime

```bash
curl "http://localhost:9600"
docker compose logs -f logstash
```

Ce que fait le code:
- Lit l'etat runtime de Logstash
- Suit les erreurs de parsing en temps reel

---

## Partie TP

TP d'approfondissement (2h):
- [TP Films (2h) - Logstash + Elasticsearch](tp-05-films-2h.html)

---
