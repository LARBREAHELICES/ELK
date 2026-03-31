# 🔬 SciPulse — Veille scientifique & Tech augmentée

> Plateforme de veille intelligente croisant **ArXiv** (publications scientifiques) et **Hacker News** (actualité tech), construite avec une approche **DataOps**.

## Architecture

```
ArXiv (batch, 2M+ articles)        Hacker News (streaming, API Firebase)
        │                                       │
        ▼                                       ▼
   MinIO (landing)                     Python hn_poller.py
        │                                       │
        ▼                                       │
   Logstash (parse JSON)                        │
        │                                       │
        ▼                                       ▼
┌─────────────────── Elasticsearch ───────────────────┐
│  arxiv-papers   hn-items   arxiv-hn-links   logs    │
└──────────┬──────────────────────────────────────────┘
           │
     ┌─────┴─────┐
  Kibana     PostgreSQL + dbt
```

## Prérequis

- **Docker Desktop** ≥ 4.x avec **16 Go de RAM** alloués
- **Python** ≥ 3.11
- **Git**
- Connexion internet (API Hacker News + dump ArXiv)

## Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone <url-du-repo> scipulse && cd scipulse

# 2. Copier la config
cp .env.example .env

# 3. Lancer la stack
docker compose up -d

# 4. Vérifier les services
#    - Kibana        → http://localhost:5601
#    - Airflow       → http://localhost:8080  (admin / admin)
#    - MinIO Console → http://localhost:9001  (minioadmin / minioadmin)
#    - Elasticsearch → http://localhost:9200

# 5. Installer les dépendances Python (pour le dev local)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 6. Créer les index Elasticsearch
python -m src.utils.mappings

# 7. Télécharger le dump ArXiv (subset)
# → Placer les fichiers JSON dans data/arxiv-raw/
# → Dataset complet : https://www.kaggle.com/datasets/Cornell-University/arxiv

# 8. Lancer le poller HN (un cycle)
python -m src.ingestion.hn_poller

# 9. Lancer les tests
pytest tests/ -v
```

## Arborescence du projet

```
scipulse/
├── docker-compose.yml              # Stack complète (ES, Logstash, Kibana, Airflow, PG, MinIO)
├── requirements.txt                # Dépendances Python
├── .env.example                    # Variables d'environnement (template)
├── .gitignore
│
├── docker/                         # Configs Docker
│   ├── elasticsearch/              #   (réservé pour config custom ES)
│   ├── logstash/
│   │   ├── config/logstash.yml     #   Config principale Logstash
│   │   └── pipeline/arxiv.conf     #   Pipeline d'ingestion ArXiv
│   ├── kibana/                     #   (réservé pour config custom Kibana)
│   └── postgres/
│       └── init.sql                #   Création de la base scipulse
│
├── airflow/                        # Apache Airflow
│   ├── dags/
│   │   ├── dag_arxiv_pipeline.py   #   DAG batch ArXiv (6 tâches)
│   │   └── dag_hn_poller.py        #   DAG micro-batch HN (3 tâches, */5min)
│   ├── plugins/
│   └── logs/
│
├── src/                            # Code source Python
│   ├── ingestion/
│   │   └── hn_poller.py            #   Poller API HN + indexation ES
│   ├── transformation/             #   (scripts de transformation Python)
│   ├── enrichment/                 #   (enrichissement NLP, croisement ArXiv×HN)
│   ├── search/
│   │   └── search_service.py       #   Module de requêtes ES avancées
│   ├── quality/                    #   (suites Great Expectations)
│   └── utils/
│       └── mappings.py             #   Mappings ES (arxiv-papers, hn-items, liens)
│
├── dbt/                            # Projet dbt
│   ├── dbt_project.yml
│   ├── profiles.yml
│   ├── models/
│   │   ├── schema.yml              #   Sources, tests, documentation
│   │   ├── staging/
│   │   │   └── stg_arxiv_papers.sql
│   │   └── marts/
│   │       └── fct_publications_par_mois.sql
│   ├── tests/
│   └── macros/
│
├── tests/                          # Tests Pytest
│   ├── unit/
│   │   ├── test_search_service.py  #   Tests du module de recherche
│   │   └── test_hn_poller.py       #   Tests du poller HN
│   └── integration/
│
├── data/                           # Données (non versionnées)
│   ├── arxiv-raw/                  #   Dump ArXiv JSON
│   └── hn-raw/                     #   (optionnel : snapshots HN)
│
├── notebooks/                      # Jupyter notebooks d'exploration
└── docs/                           # Documentation complémentaire
```

## Services et ports

| Service         | URL                          | Identifiants          |
|-----------------|------------------------------|-----------------------|
| Kibana          | http://localhost:5601        | —                     |
| Elasticsearch   | http://localhost:9200        | —                     |
| Airflow         | http://localhost:8080        | `admin` / `admin`     |
| MinIO Console   | http://localhost:9001        | `minioadmin` / `minioadmin` |
| PostgreSQL      | localhost:5432               | `scipulse` / `scipulse` |

## Index Elasticsearch

| Index             | Description                                    |
|-------------------|------------------------------------------------|
| `arxiv-papers-raw`| Articles bruts ingérés par Logstash             |
| `arxiv-papers`    | Articles enrichis (mapping optimisé full-text)  |
| `hn-items`        | Posts et commentaires HN (relation parent-child)|
| `arxiv-hn-links`  | Table de liaison ArXiv ↔ HN                    |
| `pipeline-logs`   | Logs du pipeline (observabilité)                |

## Commandes utiles

```bash
# Relancer un seul service
docker compose restart elasticsearch

# Suivre les logs Logstash
docker compose logs -f logstash

# Vérifier le nombre de documents
curl -s localhost:9200/arxiv-papers/_count | python -m json.tool

# Lancer dbt
cd dbt && dbt run && dbt test

# Poller HN en continu
python -m src.ingestion.hn_poller --continuous --interval 60
```

## Ressources

- [Dataset ArXiv (Kaggle)](https://www.kaggle.com/datasets/Cornell-University/arxiv)
- [API Hacker News](https://github.com/HackerNews/API)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Airflow Documentation](https://airflow.apache.org/docs/)
- [Great Expectations](https://docs.greatexpectations.io)
- [dbt Documentation](https://docs.getdbt.com)
