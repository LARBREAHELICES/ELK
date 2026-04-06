# TP Films (2h) - Logstash + Elasticsearch (TMDB 10 000 films)

## But du TP

Construire une chaine d'ingestion complete avec **un vrai dataset TMDB**:
- ingestion CSV avec Logstash
- conversion des types
- parsing de date
- indexation Elasticsearch
- analyses metier simples

Duree cible: **2 heures**.

---

## Dataset utilise

Fichier source:

`sandbox/data/Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv`

Colonnes detectees:
- `index`
- `title`
- `original_language`
- `release_date` (format `dd-MM-yyyy`)
- `popularity`
- `vote_average`
- `vote_count`
- `overview`

Volume: **10 001 lignes** (1 header + 10 000 films).

---

## Demarrage Docker (copier-coller)

```bash
cd /Users/antoinelucsko/Desktop/HETIC/ELK/sandbox

# Mettre la conf CSV en place (depuis le dossier Exercices)
cp ../markdown/Exercices/logstash.conf ./logstash.conf

# Verifier que le CSV TMDB est bien dans /data (monte dans le conteneur)
ls -lh ./data/*TMDB*.csv

# Demarrer les services utiles
docker compose up -d elasticsearch kibana logstash

# Tester la config Logstash
docker compose run --rm logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf

# Forcer une reingestion propre (optionnel)
docker compose exec logstash rm -f /tmp/logstash_tmdb_movies.sincedb
docker compose restart logstash

# Suivre les logs
docker compose logs -f --tail=200 logstash

# Verification ingestion
curl "http://localhost:9200/tmdb-movies/_count?pretty"
```

---

## Pre-requis (10 min)

1. Verifier les services:

```bash
docker compose ps
```

2. Verifier la presence du CSV dans `sandbox/data`:

```bash
ls -lh ./data/*TMDB*.csv
```

---

## Etape 1 - Pipeline Logstash TMDB (40 min)

Le pipeline de depart est fourni ici:

`markdown/Exercices/logstash.conf`

Dans ce projet, il doit etre copie vers:

`sandbox/logstash.conf`

Contenu attendu:

```conf
input {
  file {
    path => "/data/*TMDB*.csv"
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

  stdout { codec => rubydebug }
}
```

Lancer/relancer Logstash, puis verifier:

```bash
docker compose restart logstash
curl "http://localhost:9200/tmdb-movies/_count?pretty"
```

Checkpoint attendu:
- `count` proche de `10000` (pas `0`).

---

## Etape 2 - Controle qualite (20 min)

Verifier mapping + echantillon:

```bash
curl "http://localhost:9200/tmdb-movies/_mapping?pretty"
curl "http://localhost:9200/tmdb-movies/_search?pretty&size=3"
```

Verifier les anomalies de date:

```bash
curl -X GET "http://localhost:9200/tmdb-movies/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "bool": {
      "must_not": [
        { "exists": { "field": "release_date_ts" } }
      ]
    }
  }
}'
```

Checkpoint attendu:
- `movie_id` en `integer`
- `popularity` / `vote_average` en `float`
- `vote_count` en `integer`
- peu ou pas de documents sans `release_date_ts`

---

## Etape 3 - Analyses metier (40 min)

### Requete 1 - Top 10 langues

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

### Requete 2 - Top 10 films par popularite

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

### Requete 3 - Films "solides" (vote_count >= 1000)

```json
GET tmdb-movies/_search
{
  "query": {
    "bool": {
      "filter": [
        { "range": { "vote_count": { "gte": 1000 } } },
        { "range": { "vote_average": { "gte": 7.5 } } }
      ]
    }
  },
  "sort": [
    { "vote_average": "desc" }
  ],
  "_source": ["title", "vote_average", "vote_count"]
}
```

### Requete 4 - Evolution des sorties (par annee)

```json
GET tmdb-movies/_search
{
  "size": 0,
  "aggs": {
    "releases_by_year": {
      "date_histogram": {
        "field": "release_date_ts",
        "calendar_interval": "year"
      }
    }
  }
}
```

---

## Bonus (10 min)

1. Ajouter un champ `quality_band`:
- `A` si `vote_average >= 8`
- `B` si `vote_average >= 7`
- `C` sinon

2. Compter les films par `quality_band`.

---

## Erreurs frequentes (a corriger vite)

1. `count = 0`
- verifier que le CSV est bien dans `./data`
- verifier que `sandbox/logstash.conf` est bien la conf CSV

2. Pas de reinjection apres modif de conf
- supprimer `sincedb` puis redemarrer:

```bash
docker compose exec logstash rm -f /tmp/logstash_tmdb_movies.sincedb
docker compose restart logstash
```

3. Erreur de parsing CSV
- verifier `separator`, `quote_char` et `columns`
- lire les logs: `docker compose logs -f logstash`

---

## Livrables attendus

1. Le pipeline Logstash utilise (`sandbox/logstash.conf`)
2. Les commandes de verification (`_count`, `_mapping`, `_search`)
3. Les 4 requetes metier
4. Une interpretation courte (2-3 lignes) pour chaque requete

---

## Grille de temps recommandee

- 0:00 -> 0:10: setup + copie dataset
- 0:10 -> 0:50: pipeline + ingestion
- 0:50 -> 1:10: qualite de donnees
- 1:10 -> 1:50: analyses metier
- 1:50 -> 2:00: bonus + rendu
