# Cours 5 - Logstash Cas d'usage
## Ingestion, parsing et enrichissement expliques

---

## Objectif du chapitre

- Generer un flux de logs de demo
- Transformer du texte brut en champs exploitables
- Verifier techniquement l'ingestion dans Elasticsearch
- Comprendre les points de fragilite d'un pipeline

---


## Reperes theoriques (pipeline)

- Logstash suit la chaine <span class="glossary-term" data-definition="Architecture pipeline Logstash: lecture, transformation, puis envoi vers une destination.">`input -> filter -> output`</span>
- La qualite de parsing conditionne la valeur metier en aval
- Un pipeline robuste doit etre observable et testable

---

## Generer des logs d'exemple

```bash
cat > logs/app.log <<'LOG'
2026-03-30T10:15:00Z INFO api - User 42 created order 9001
2026-03-30T10:16:45Z WARN billing - Payment retry for order 9002
2026-03-30T10:17:12Z ERROR worker - Timeout while exporting report 77
LOG

docker compose restart logstash
```

Ce que fait le code:
- Cree un jeu de logs simple et reproductible
- Relance Logstash pour relire et parser le fichier

---

## Pipeline Logstash (fichier de conf)

```conf
input {
  file {
    path => "/usr/share/logstash/logs/*.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
}

filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:log_timestamp} %{LOGLEVEL:level} %{DATA:service} - %{GREEDYDATA:log_message}"
    }
    tag_on_failure => ["_grokparsefailure_app"]
  }
  date { match => ["log_timestamp", "ISO8601"] }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

Ce que fait le code:
- `input file`: lit les logs en entree
- <span class="glossary-term" data-definition="Filtre Logstash base sur des patterns pour extraire des champs structures depuis une ligne texte.">`grok`</span>: extrait timestamp, niveau, service, message
- `date`: aligne <span class="glossary-term" data-definition="Champ temporel standard Elasticsearch/Kibana utilise pour tri et analyses chronologiques.">`@timestamp`</span> pour analyses temporelles
- `output`: indexe les events dans Elasticsearch

---

## Requetes de verification Elasticsearch

```bash
curl "http://localhost:9200/_cat/indices?v"
curl "http://localhost:9200/app-logs-*/_count?pretty"
curl -X GET "http://localhost:9200/app-logs-*/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 5,
  "sort": [{"@timestamp": "desc"}]
}'
```

Ce que fait le code:
- Verifie que l'index journalier existe
- Controle le volume d'events ingeres
- Lit un echantillon recent pour valider les champs parsees

---

## Requete metier d'exemple (niveau ERROR)

```bash
curl -X GET "http://localhost:9200/app-logs-*/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "bool": {
      "filter": [
        { "term": { "level": "ERROR" } }
      ]
    }
  },
  "aggs": {
    "by_service": { "terms": { "field": "service.keyword" } }
  }
}'
```

Ce que fait le code:
- Isole les erreurs
- Regroupe les erreurs par service pour prioriser les actions

Repere theorique:
- Sans champs bien parsees (`level`, `service`), cette requete est impossible

---

## Qualite de parsing et enrichissement

Points a controler:
- Presence de `_grokparsefailure_app`
- Coherence de `@timestamp`
- Types corrects des champs (keyword/date)

Enrichissements utiles:
- `geoip` pour IP
- `useragent` pour devices
- `mutate` pour normalisation

---

## Observabilite runtime

```bash
curl "http://localhost:9600"
docker compose logs -f logstash
```

Ce que fait le code:
- Lit l'etat runtime de Logstash (API monitor)
- Suit les erreurs de parsing en temps reel

---

## Exercices proposes (Chapitre 5)

1. Ingestion minimale d'un fichier de logs
2. Parsing `grok` des champs metier (`level`, `service`, `log_message`)
3. Controle qualite avec `tag_on_failure` + correction `@timestamp`
4. Requete metier: erreurs par service + derniers incidents

Lien exercice:
- [Exercice 05 - Logstash](exercice-05-logstash.html)

Lien correction:
- [Correction 05 - Logstash](correction-05-logstash.html)

---

## Partie TP

TP d'approfondissement (2h):
- [TP Films (2h) - Logstash + Elasticsearch](tp-05-films-2h.html)

---
