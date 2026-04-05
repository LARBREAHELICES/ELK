# Correction 05 - Logstash (Chapitre 5)

## Exercice 1 - Ingestion minimale

Pipeline minimal:

```conf
input {
  file {
    path => "/usr/share/logstash/logs/app.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
}

output {
  stdout { codec => rubydebug }
}
```

Verification:

```bash
docker compose restart logstash
docker compose logs -f logstash
```

Points cle:
- `message` contient la ligne brute.
- L'event JSON ajoute des metadonnees (`@timestamp`, `host`, etc.).
- `sincedb_path => "/dev/null"` force la relecture complete a chaque test.

---

## Exercice 2 - Parsing avec grok

Pipeline avec parsing:

```conf
filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:log_timestamp} %{LOGLEVEL:level} %{DATA:service} - %{GREEDYDATA:log_message}"
    }
    tag_on_failure => ["_grokparsefailure_app"]
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

Verification:

```bash
curl "http://localhost:9200/app-logs-*/_search?size=3&pretty"
```

Champs extraits attendus:
- `log_timestamp`
- `level`
- `service`
- `log_message`

---

## Exercice 3 - Qualite de parsing

Ajouter la conversion temporelle:

```conf
filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:log_timestamp} %{LOGLEVEL:level} %{DATA:service} - %{GREEDYDATA:log_message}"
    }
    tag_on_failure => ["_grokparsefailure_app"]
  }

  date {
    match => ["log_timestamp", "ISO8601"]
  }
}
```

Verifier les erreurs de parsing:

```bash
curl -X GET "http://localhost:9200/app-logs-*/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "term": {
      "tags": "_grokparsefailure_app"
    }
  }
}'
```

Pourquoi `@timestamp`:
- tri chronologique fiable
- filtrage temporel Kibana
- histogrammes temporels exacts

---

## Exercice 4 - Requete metier et priorisation

Requete complete:

```bash
curl -X GET "http://localhost:9200/app-logs-*/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 3,
  "sort": [
    {"@timestamp": "desc"}
  ],
  "query": {
    "term": {
      "level": "ERROR"
    }
  },
  "aggs": {
    "errors_by_service": {
      "terms": {
        "field": "service.keyword",
        "size": 10
      }
    }
  }
}'
```

Lecture du resultat:
- `aggregations.errors_by_service.buckets` donne le classement des services les plus en erreur.
- Les `hits` tries par `@timestamp desc` donnent les derniers incidents a analyser en premier.

---

## Synthese

- Ex1: ingestion brute validee
- Ex2: parsing `grok` valide
- Ex3: qualite de parsing controlee
- Ex4: analyse metier orientee priorisation
