# Introduction à Logstash

## Rôle

Logstash sert à **envoyer des données vers Elasticsearch** en pouvant les **transformer** au passage.

Pipeline :

```text
input → filter → output
```

---

# Structure d'un pipeline

## Input — lire les données

Exemple : lire un fichier JSON

```conf
input {
  file {
    path => "/data/films.jsonl"
    start_position => "beginning"
    sincedb_path => "/dev/null"
    codec => json
  }
}
```

---

## Filter — transformer 

Exemples :

```conf
filter {
  mutate {
    rename => { "title" => "film_title" }
  }

  mutate {
    convert => { "year" => "integer" }
  }

  mutate {
    add_field => { "source" => "logstash" }
  }
}
```

---

## Output — envoyer vers Elasticsearch

```conf
output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "films"
  }

  stdout {
    codec => rubydebug
  }
}
```

---

# Pipeline complet

```conf
input {
  file {
    path => "/data/films.jsonl"
    start_position => "beginning"
    sincedb_path => "/dev/null"
    codec => json
  }
}

filter {
  mutate {
    convert => { "year" => "integer" }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "films"
  }

  stdout {
    codec => rubydebug
  }
}
```

---

# Lancer Logstash

```bash
logstash -f films.conf
```

---

# À retenir

| Partie | Rôle                       |
| ------ | -------------------------- |
| input  | lire données               |
| filter | modifier données           |
| output | envoyer vers Elasticsearch |

---

# Dans votre projet

| Outil         | Rôle                  |
| ------------- | --------------------- |
| Python        | indexation manuelle   |
| Logstash      | ingestion automatique |
| Elasticsearch | stockage + recherche  |
| Kibana        | visualisation         |

---

# Objectif TP

Faire un pipeline qui :

1. lit un fichier JSON
2. modifie un champ
3. envoie dans Elasticsearch
4. visualise dans Kibana

---

# Résumé en une phrase

**Logstash sert à lire des données, les transformer, puis les envoyer dans Elasticsearch.**
