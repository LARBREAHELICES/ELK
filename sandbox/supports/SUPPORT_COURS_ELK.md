# Support de Cours: ELK + JupyterLab + PostgreSQL

## 1. Objectif du cours
Comprendre et pratiquer un pipeline de donnees complet:
- ingestion de logs applicatifs via Logstash
- indexation et recherche dans Elasticsearch
- exploration et visualisation dans Kibana
- preparation de donnees relationnelles avec PostgreSQL
- envoi de donnees de PostgreSQL vers Elasticsearch depuis JupyterLab

En sortie, tu sais expliquer le role de chaque service et reproduire le flux de bout en bout.

## 2. Architecture de la stack

```text
                +----------------------+
                |      app.log         |
                | (logs de demo)       |
                +----------+-----------+
                           |
                           v
                    +------+------+
                    |   Logstash  |
                    | parse/filter|
                    +------+------+
                           |
                           v
+-------------+     +------+------+
| PostgreSQL  |     | Elasticsearch|
| donnees SQL |---->| index/search |
+------+------+     +------+------+
       ^                    |
       |                    v
+------+-------+      +-----+------+
| JupyterLab   |      |   Kibana   |
| notebooks    |      | dashboards |
+--------------+      +------------+
```

## 3. Role de chaque composant

1. Elasticsearch
- Base orientee documents JSON.
- Stocke les index (`products_demo`, `app-logs-*`).
- Permet recherche full-text, filtres, agregations.

2. Logstash
- Lit des fichiers de logs (`logs/app.log`).
- Parse les lignes avec `grok`.
- Transforme les champs (`@timestamp`, `service`, `level`, `log_message`).
- Envoie vers Elasticsearch.

3. Kibana
- Interface de lecture/exploration des donnees Elasticsearch.
- Utilisation principale:
  - `Discover` pour inspecter des documents.
  - `Lens` pour visualiser des agregations.

4. PostgreSQL
- Base relationnelle pour les donnees metier structurees.
- Source de donnees dans le notebook.

5. JupyterLab
- Environnement d experimentation Python.
- Le notebook:
  - lit/ecrit dans PostgreSQL
  - envoie des documents vers Elasticsearch
  - execute des requetes de recherche/agregation.

## 4. Ce qui se passe "sous le capot"

### Flux A: logs -> Logstash -> Elasticsearch -> Kibana
1. Logstash ouvre `logs/app.log`.
2. Chaque ligne devient un event brut (`message`).
3. `grok` extrait:
- timestamp
- niveau (`INFO`, `WARN`, `ERROR`)
- service (`api`, `billing`, `worker`)
- message metier.
4. Le filtre `date` convertit le timestamp en `@timestamp`.
5. L event est indexe dans `app-logs-YYYY.MM.dd`.
6. Kibana lit cet index via un Data View `app-logs-*`.

### Flux B: PostgreSQL -> Jupyter -> Elasticsearch -> Kibana
1. Le notebook cree/remplit la table `products`.
2. Le notebook lit les lignes SQL.
3. Conversion en documents JSON.
4. Indexation bulk vers `products_demo`.
5. Requetes Elasticsearch (full-text, bool filter, aggregations).
6. Kibana peut visualiser l index `products_demo`.

## 5. Pratique guidee

## Etape 0 - Demarrer
```bash
docker compose up -d
docker compose ps
```

Tu dois voir 5 conteneurs: `elasticsearch`, `kibana`, `postgres`, `jupyter`, `logstash`.

## Etape 1 - Verifier les services
```bash
curl http://localhost:9200
curl http://localhost:5601/api/status
curl http://localhost:9600
docker compose exec postgres pg_isready -U elk -d elk_course
curl -I "http://localhost:8888/lab?token=elasticlab"
```

## Etape 2 - Verifier ingestion Logstash
```bash
curl "http://localhost:9200/app-logs-*/_search?pretty"
```

Resultat attendu:
- `hits.total.value` >= 1
- champs presents dans `_source`: `service`, `level`, `log_message`, `@timestamp`.

## Etape 3 - Executer le notebook de demo
1. Ouvrir JupyterLab: `http://localhost:8888/lab?token=elasticlab`
2. Ouvrir `notebooks/demo_elk_postgres.ipynb`
3. Executer toutes les cellules.

Resultat attendu:
- table PostgreSQL `products` peuplee
- index Elasticsearch `products_demo` cree et rempli
- sorties de recherche/agregation visibles dans notebook.

## Etape 4 - Explorer dans Kibana
1. Aller sur `http://localhost:5601`.
2. Creer Data View `app-logs-*`.
3. Creer Data View `products_demo`.
4. Dans Discover:
- filtrer `level: ERROR` sur `app-logs-*`
- rechercher "clavier" sur `products_demo`.

## 6. Lire et comprendre `logstash.conf`

Chemin: `logstash.conf`

1. `input/file`
- `path` cible tous les `.log` du dossier monte.
- `start_position => beginning` lit depuis le debut.
- `sincedb_path => /dev/null` force la relecture au redemarrage (utile en demo).

2. `filter/grok`
- pattern:
`TIMESTAMP LOGLEVEL SERVICE - MESSAGE`
- exemple:
`2026-03-30T10:16:45Z WARN billing - Payment retry for order 9002`

3. `filter/date`
- convertit timestamp texte en date technique `@timestamp`.

4. `output/elasticsearch`
- envoie vers `http://elasticsearch:9200`
- index journalier `app-logs-%{+YYYY.MM.dd}`.

## 7. Exercices proposes

1. Ajouter 3 lignes dans `logs/app.log` avec un nouveau `service` (`auth`).
2. Redemarrer Logstash:
```bash
docker compose restart logstash
```
3. Verifier que le nouveau service apparait:
```bash
curl "http://localhost:9200/app-logs-*/_search?q=service:auth&pretty"
```
4. Dans Kibana Lens, creer:
- un histogramme de logs par `@timestamp`
- un donut par `level`.

## 8. Pannes frequentes et diagnostic

1. Pas de documents dans `app-logs-*`
- verifier `docker compose logs logstash`
- verifier chemin source: `logs/app.log`
- verifier pattern `grok` (ligne mal formatee).

2. Kibana ne charge pas
- attendre le demarrage complet d Elasticsearch
- verifier `curl http://localhost:5601/api/status`.

3. Notebook n accede pas a Postgres
- verifier service `postgres` healthy
- verifier variables `COURSE_PG_*` dans `docker-compose.yml`.

4. Elasticsearch out of memory
- augmenter memoire Docker Desktop
- adapter `ES_JAVA_OPTS`.

## 9. Resume simple
- Elasticsearch stocke/recherche.
- Logstash transforme/ingere les logs.
- Kibana visualise.
- PostgreSQL stocke relationnel.
- Jupyter fait le pont data/analytique.

Tu as 2 pipelines complets:
- pipeline logs (ELK)
- pipeline data SQL vers index de recherche.
