# Logstash avec un dataset films

## Objectif

Utiliser Logstash pour ingerer un CSV reel de films dans Elasticsearch,
et savoir **nommer**, **placer**, **executer** et **debugger** un pipeline.

Pipeline :

```text
input -> filter -> output
```

---

## Ou placer le fichier `.conf` ?

Dans ce projet (compose actuel) :

```yaml
- ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
```

Donc :
- host : `sandbox/logstash.conf`
- container : `/usr/share/logstash/pipeline/logstash.conf`

---

## Comment executer ?

```bash
docker compose up -d logstash
docker compose restart logstash
docker compose logs -f logstash
```

Tester la config avant execution :

```bash
docker compose run --rm logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf
```

---

## Dataset TMDB (CSV)

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

## Pipeline CSV (TMDB)

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

## Et si c'est un texte brut ? (`grok` / regex)

Exemple ligne :

```text
2026-04-05T12:10:00Z INFO api - GET /movies/123 200 42ms
```

Exemple filtre :

```conf
grok {
  match => {
    "message" => "%{TIMESTAMP_ISO8601:log_ts} %{LOGLEVEL:level} %{DATA:service} - %{WORD:method} %{URIPATHPARAM:path} %{INT:status:int} %{INT:duration_ms:int}ms"
  }
  tag_on_failure => ["_grokparsefailure_app"]
}
```

---

## Regex custom

Inline :

```conf
pattern_definitions => { "MOVIEID" => "MOV-[0-9]{6}" }
```

Ou via dossier patterns (recommande):
- monter `./patterns:/usr/share/logstash/patterns:ro`
- utiliser `patterns_dir => ["/usr/share/logstash/patterns"]`

---

## Verifications utiles

```bash
curl "http://localhost:9200/tmdb-movies/_count?pretty"
curl "http://localhost:9200/tmdb-movies/_mapping?pretty"
curl "http://localhost:9200/tmdb-movies/_search?pretty&size=3"
```

Erreurs grok :

```bash
curl -X GET "http://localhost:9200/app-logs-*/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": { "term": { "tags": "_grokparsefailure_app" } }
}'
```

---

## A retenir

- Nommer et placer correctement `logstash.conf`
- Tester la config avec `--config.test_and_exit`
- Utiliser `csv` pour fichiers tabulaires
- Utiliser `grok` pour parsing regex des logs texte
