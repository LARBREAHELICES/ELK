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

## Test local isole (sans impacter les autres conteneurs)

Utiliser un nom de projet Compose dedie:

```bash
cd /Users/antoinelucsko/Desktop/HETIC/ELK/app-films
cp .env.example .env
docker compose -p appfilms_local up -d --build
docker compose -p appfilms_local ps
```

Verification rapide:

```bash
curl http://localhost:18000/health
```

Pourquoi c'est isole:
- ports dedies (`19200`, `15601`, `18000`, `15173`, `19600`)
- reseau et volumes prefixes par `appfilms_local`

Arret de cette stack uniquement:

```bash
docker compose -p appfilms_local down
```

Arret + suppression des volumes de cette stack uniquement:

```bash
docker compose -p appfilms_local down -v
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
