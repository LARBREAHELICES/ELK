# Logstash - Cas d'usage TMDB
## Ingestion CSV, execution pipeline et parsing regex

---

## Objectif du cours

- Ingerer un CSV reel de 10 000 films TMDB
- Savoir **ou mettre** le fichier pipeline Logstash
- Savoir **comment lancer** et **tester** le pipeline
- Transformer les champs en types exploitables
- Ajouter des regles regex (`grok`) pour parser du texte brut

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

## Ou mettre le fichier Logstash ?

Avec le `docker-compose` du cours (actuel), le montage est :

```yaml
- ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
```

Donc, dans ce setup :
- le fichier host doit s'appeler **`sandbox/logstash.conf`**
- dans le container, il sera lu comme **`/usr/share/logstash/pipeline/logstash.conf`**

---

## Convention de nommage (quand on a plusieurs pipelines)

Convention recommandee :
- `10_input_*.conf`
- `20_filter_*.conf`
- `30_output_*.conf`

Mais pour ca, il faut monter un dossier complet `pipelines/` (et pas un seul fichier).

---

## Comment executer le pipeline ?

Demarrage/restart :

```bash
docker compose up -d logstash
docker compose restart logstash
```

Suivi des logs :

```bash
docker compose logs -f logstash
```

---

## Comment tester la config avant execution ?

Validation syntaxe + config :

```bash
docker compose run --rm logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf
```

Si cette commande passe, la config est syntaxiquement valide.

---

## Preparation du fichier TMDB

```bash
mkdir -p logs/films
cp "sandbox/data/Latest 10000 Movies Dataset from TMDB export 2026-04-05 16-03-36.csv" logs/films/tmdb_movies.csv
docker compose restart logstash
```

Ce que fait le code:
- Place le CSV dans le dossier monte dans Logstash
- Redemarre Logstash pour relancer la lecture

---

## Pipeline Logstash TMDB (CSV)

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
  stdout { codec => rubydebug }
}
```

---

## Requetes de verification Elasticsearch

```bash
curl "http://localhost:9200/_cat/indices?v"
curl "http://localhost:9200/tmdb-movies/_count?pretty"
curl "http://localhost:9200/tmdb-movies/_mapping?pretty"
curl "http://localhost:9200/tmdb-movies/_search?pretty&size=3"
```

---

## Si le fichier est du texte brut : parsing regex (`grok`)

Exemple de ligne log :

```text
2026-04-05T12:10:00Z INFO api - GET /movies/123 200 42ms
```

Filtre `grok` associe :

```conf
grok {
  match => {
    "message" => "%{TIMESTAMP_ISO8601:log_ts} %{LOGLEVEL:level} %{DATA:service} - %{WORD:method} %{URIPATHPARAM:path} %{INT:status:int} %{INT:duration_ms:int}ms"
  }
  tag_on_failure => ["_grokparsefailure_app"]
}
```

---

## Ou mettre des regex custom ?

Option 1 (rapide) : `pattern_definitions` inline

```conf
grok {
  pattern_definitions => { "MOVIEID" => "MOV-[0-9]{6}" }
  match => { "message" => "%{MOVIEID:movie_code}" }
}
```

Option 2 (propre) : fichier de patterns externe
- monter `./patterns:/usr/share/logstash/patterns:ro`
- utiliser `patterns_dir => ["/usr/share/logstash/patterns"]`

---

## Comment debug un regex qui casse ?

1. Regarder les logs Logstash :

```bash
docker compose logs -f logstash
```

2. Chercher les events en erreur (`_grokparsefailure_app`) :

```bash
curl -X GET "http://localhost:9200/app-logs-*/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "term": {
      "tags": "_grokparsefailure_app"
    }
  }
}'
```

---

## Requete metier - top langues TMDB

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

---

## Requete metier - top films par popularite

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

---

## Partie TP

TP d'approfondissement (2h):
- [TP Films (2h) - Logstash + Elasticsearch](tp-05-films-2h.html)

---
