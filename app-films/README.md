# app-films

Application de recherche films full-stack:
- ingestion CSV via Logstash
- indexation/recherche Elasticsearch
- API FastAPI
- UI React + TypeScript + TanStack Query + composants shadcn
- exploration dans Kibana

Ce dossier est isole de `sandbox` et n'en modifie aucun fichier.

## Prerequis
- Docker + Docker Compose
- un fichier CSV TMDB dans `app-films/data` (ex: `Latest 10000 Movies Dataset from TMDB ...csv`)

Option rapide pour reutiliser ton dataset sandbox:

```bash
cp ../sandbox/data/*TMDB*.csv ./data/
```

## Lancer

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

## URLs
- Frontend: http://localhost:15173
- API FastAPI: http://localhost:18000/docs
- Elasticsearch: http://localhost:19200
- Kibana: http://localhost:15601
- Logstash API: http://localhost:19600

## Pipeline Logstash
Le pipeline lit:
- `/data/*TMDB*.csv`

et indexe dans:
- `tmdb-movies`

## Rejouer une ingestion CSV
Le pipeline utilise:
- `sincedb_path => "/tmp/logstash_tmdb_movies.sincedb"`

Si tu veux relire le fichier depuis le debut:

```bash
docker compose restart logstash
```

## Arret

```bash
docker compose down
```

## Arret + suppression donnees Elasticsearch

```bash
docker compose down -v
```
