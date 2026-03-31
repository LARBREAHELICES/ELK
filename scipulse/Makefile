# =============================================================================
#  SciPulse — Makefile
#  Raccourcis pour les opérations courantes
# =============================================================================

.PHONY: up down restart logs status create-indices test lint clean

# --- Stack Docker ---------------------------------------------------------

up:
	docker compose up -d
	@echo "\n✅ Stack démarrée"
	@echo "   Kibana        → http://localhost:5601"
	@echo "   Airflow       → http://localhost:8080"
	@echo "   MinIO Console → http://localhost:9001"
	@echo "   Elasticsearch → http://localhost:9200"

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

logs:
	docker compose logs -f $(SERVICE)

status:
	@echo "=== Conteneurs ==="
	@docker compose ps
	@echo "\n=== Elasticsearch ==="
	@curl -s localhost:9200/_cat/indices?v 2>/dev/null || echo "  ⚠️  ES non disponible"

# --- Elasticsearch --------------------------------------------------------

create-indices:
	python -m src.utils.mappings

# --- Ingestion ------------------------------------------------------------

poll-hn:
	python -m src.ingestion.hn_poller

poll-hn-continuous:
	python -m src.ingestion.hn_poller --continuous --interval 60

# --- dbt ------------------------------------------------------------------

dbt-run:
	cd dbt && dbt run

dbt-test:
	cd dbt && dbt test

dbt-docs:
	cd dbt && dbt docs generate && dbt docs serve

# --- Tests ----------------------------------------------------------------

test:
	pytest tests/ -v --tb=short

test-cov:
	pytest tests/ -v --cov=src --cov-report=html

# --- Nettoyage ------------------------------------------------------------

clean:
	docker compose down -v
	rm -rf dbt/target dbt/logs
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Nettoyage terminé (volumes Docker supprimés)"
