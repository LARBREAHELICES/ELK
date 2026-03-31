# Sandbox ELK + Jupyter + Postgres

## Prerequis
- Docker Desktop (ou moteur Docker + plugin Compose)
- Ports libres: `9200`, `9300`, `5601`, `5432`, `8888`, `9600`

## Services inclus
- Elasticsearch (`http://localhost:9200`)
- Kibana (`http://localhost:5601`)
- PostgreSQL (`localhost:5432`)
- JupyterLab (`http://localhost:8888`, token: `elasticlab`)
- Logstash (`http://localhost:9600`)

## Lancement
```bash
docker compose up -d
docker compose ps
```

## Verification rapide
Elasticsearch:
```bash
curl http://localhost:9200
```

Kibana:
```bash
curl http://localhost:5601/api/status
```

PostgreSQL:
```bash
docker compose exec postgres pg_isready -U elk -d elk_course
```

Jupyter:
```bash
curl -I http://localhost:8888/lab
```

Logstash:
```bash
curl http://localhost:9600
```

## Notebook de demo
- Notebook: `notebooks/demo_elk_postgres.ipynb`
- Ouvrir JupyterLab: `http://localhost:8888/lab?token=elasticlab`
- Le notebook:
  - charge des donnees dans PostgreSQL
  - indexe ces donnees dans Elasticsearch (`products_demo`)
  - execute recherche full-text + filtres + aggregations

## Module data Shakespeare (full-text)
- Source dataset: `https://raw.githubusercontent.com/grokify/kibana-tutorial-go/refs/heads/master/shakespeare.json`
- Echantillon local rapide: `data/shakespeare_sample.ndjson`
- Index Elasticsearch cible: `shakespeare`
- Data View Kibana a creer: `shakespeare`

Import full dataset:
```bash
curl -L "https://raw.githubusercontent.com/grokify/kibana-tutorial-go/refs/heads/master/shakespeare.json" -o data/shakespeare.json
curl -X POST "http://localhost:9200/shakespeare/_bulk?pretty" -H "Content-Type: application/x-ndjson" --data-binary @data/shakespeare.json
curl -X POST "http://localhost:9200/shakespeare/_refresh"
```

## Supports de cours
- Support ELK global: `supports/SUPPORT_COURS_ELK.md`
- Support Kibana: `supports/SUPPORT_COURS_KIBANA.md`
- Support Data View Kibana (detaille): `supports/SUPPORT_COURS_DATA_VIEW_KIBANA.md`
- Support Elasticsearch (moteur de recherche): `supports/SUPPORT_COURS_ELASTICSEARCH_RECHERCHE.md`
- Diaporamas HTML + Markdown: `supports/diaporama-html/README.md`

## Demo Logstash
- Pipeline: `logstash.conf`
- Source log: `logs/app.log`
- Index cible Elasticsearch: `app-logs-*`

Verifier l ingestion:
```bash
curl "http://localhost:9200/app-logs-*/_search?pretty"
```

## Identifiants de demo
PostgreSQL:
- host: `localhost`
- port: `5432`
- database: `elk_course`
- user: `elk`
- password: `elkpass`

Variables utiles disponibles dans le conteneur Jupyter:
- `COURSE_ES_URL=http://elasticsearch:9200`
- `COURSE_PG_HOST=postgres`
- `COURSE_PG_DB=elk_course`
- `COURSE_PG_USER=elk`
- `COURSE_PG_PASSWORD=elkpass`
- `COURSE_DATA_DIR=/home/jovyan/data`

## Arret
```bash
docker compose down
```

## Arret + suppression des donnees
```bash
docker compose down -v
```
