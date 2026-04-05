# Exercice 05 - Logstash (Chapitre 5)

## Contexte

Vous travaillez sur un pipeline Logstash avec des logs applicatifs.
Objectif: passer de logs bruts a des donnees exploitables dans Elasticsearch.

Index cible: `app-logs-*`

---

## Exercice 1 - Ingestion minimale

### Objectif

Verifier que Logstash lit bien un fichier local.

### Travail

1. Creer un fichier `logs/app.log` avec 3 lignes:

```text
2026-03-30T10:15:00Z INFO api - User 42 created order 9001
2026-03-30T10:16:45Z WARN billing - Payment retry for order 9002
2026-03-30T10:17:12Z ERROR worker - Timeout while exporting report 77
```

2. Configurer un pipeline minimal:
- `input file`
- `output stdout { codec => rubydebug }`

3. Redemarrer Logstash et verifier que les 3 events apparaissent.

### Questions

1. Quelle difference entre `message` brut et event JSON affiche?
2. A quoi sert `sincedb_path => "/dev/null"` en phase de test?

---

## Exercice 2 - Parsing avec grok

### Objectif

Extraire les champs utiles depuis `message`.

### Travail

Ajouter un filtre `grok` pour extraire:
- `log_timestamp`
- `level`
- `service`
- `log_message`

Pattern attendu:

```text
%{TIMESTAMP_ISO8601:log_timestamp} %{LOGLEVEL:level} %{DATA:service} - %{GREEDYDATA:log_message}
```

Puis envoyer vers Elasticsearch index `app-logs-%{+YYYY.MM.dd}`.

### Questions

1. Quels champs sont nouveaux apres `grok`?
2. Pourquoi `level` doit etre present pour les analyses d'erreurs?

---

## Exercice 3 - Qualite de parsing

### Objectif

Detecter les erreurs de parsing et corriger le temps.

### Travail

1. Ajouter:
- `tag_on_failure => ["_grokparsefailure_app"]`
- filtre `date` base sur `log_timestamp`

2. Ajouter une ligne invalide dans `logs/app.log`:

```text
line_not_matching_pattern
```

3. Reingester et verifier:
- presence du tag `_grokparsefailure_app`
- coherence de `@timestamp`

### Questions

1. Comment identifier rapidement les logs non parsees?
2. Pourquoi `@timestamp` est plus utile que garder une date en texte?

---

## Exercice 4 - Requete metier et priorisation

### Objectif

Passer des logs parsees a une analyse metier.

### Travail

Ecrire une requete Elasticsearch qui:
- filtre `level = ERROR`
- regroupe par `service.keyword`
- retourne aussi les 3 derniers evenements

### Questions

1. Quel service genere le plus d'erreurs?
2. Quelle action prioriser en premier?

---

## Livrable attendu

- Fichier de conf Logstash complet
- Requetes `curl` de verification
- Requete metier `ERROR` par service
- Reponse courte aux questions des 4 exercices
