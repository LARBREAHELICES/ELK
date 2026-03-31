# Module 0 - Configuration de l environnement ELK
## Installation locale et test de bout en bout

---

## Objectif

- Lancer la stack locale avec Docker Compose
- Comprendre clairement le role de chaque service
- Inserer des donnees dans Elasticsearch
- Verifier les donnees dans Dev Tools et dans Discover

---

## Fichier a connaitre

Chemin:

```bash
sandbox/docker-compose.yml
```

Services de la stack:

- `elasticsearch` (port 9200): moteur de recherche
- `kibana` (port 5601): interface d exploration et visualisation
- `postgres` (port 5432): base relationnelle pour le fil rouge
- `logstash` (port 9600): pipeline d ingestion/transform
- `jupyter` (port 8888): notebooks de demo

---

## Lecture guidee de docker-compose

Points importants dans `sandbox/docker-compose.yml`:

- `discovery.type=single-node`: mode local mono-noeud
- `xpack.security.enabled=false`: pas d authentification en local
- `depends_on ... condition: service_healthy`: ordre de demarrage fiable
- `healthcheck`: verification automatique de disponibilite
- `volumes`: persistance (`es_data`, `postgres_data`)

---

## Demarrage de l environnement

```bash
cd sandbox
docker compose up -d
```

Verifier l etat:

```bash
docker compose ps
```

Arret propre:

```bash
docker compose down
```

---

## Checks rapides de sante

Elasticsearch:

```bash
curl http://localhost:9200
curl "http://localhost:9200/_cluster/health?pretty"
```

Kibana:

```bash
curl http://localhost:5601/api/status
```

Si les endpoints repondent, l environnement est operationnel.

---

## Test 1 - Creer un index de test

```bash
curl -X PUT "http://localhost:9200/demo_env" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "app": { "type": "keyword" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "created_at": { "type": "date" }
    }
  }
}'
```

---

## Test 2 - Inserer des donnees

```bash
curl -X POST "http://localhost:9200/demo_env/_bulk" -H "Content-Type: application/x-ndjson" -d '
{"index":{"_id":"1"}}
{"app":"api-gateway","level":"INFO","message":"Service demarre","created_at":"2026-03-31T09:00:00Z"}
{"index":{"_id":"2"}}
{"app":"api-gateway","level":"WARN","message":"Latence elevee sur endpoint /search","created_at":"2026-03-31T09:05:00Z"}
{"index":{"_id":"3"}}
{"app":"worker-sync","level":"ERROR","message":"Timeout base externe","created_at":"2026-03-31T09:07:00Z"}
'

curl -X POST "http://localhost:9200/demo_env/_refresh"
curl "http://localhost:9200/demo_env/_count?pretty"
```

Resultat attendu: `count` = `3`.

---

## Ou retrouver ces donnees - Dev Tools

1. Ouvrir Kibana: `http://localhost:5601`
2. Menu gauche -> **Dev Tools**
3. Executer:

```http
GET demo_env/_search
{
  "sort": [{"created_at": "desc"}]
}
```

![Repere Dev Tools](assets/images/env-dev-tools.svg)

---

## Ou retrouver ces donnees - Discover

1. Ouvrir **Stack Management -> Data Views**
2. Creer la data view `demo_env`
3. Aller dans **Discover**
4. Selectionner `demo_env` puis verifier les 3 documents

![Repere Discover](assets/images/env-discover.svg)

---

## Checklist de validation (fin de setup)

- `docker compose ps` montre les services `Up`
- `GET demo_env/_count` retourne `3`
- La recherche Dev Tools retourne les documents
- Discover affiche bien les memes donnees

L environnement est pret pour les modules de requetage et dataviz.
