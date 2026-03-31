# Plan de cours Elasticsearch (avec Docker Compose)

## 1) Objectif du cours
Construire les bases solides pour utiliser Elasticsearch en conditions reelles:
- comprendre son fonctionnement
- indexer des donnees
- ecrire des requetes de recherche
- analyser la pertinence et les performances
- visualiser rapidement avec Kibana

## 2) Public cible
- Developpeurs backend/fullstack
- Data analysts / BI
- DevOps qui doivent operer une stack ELK

## 3) Prerequis
- Bases JSON
- Bases HTTP/REST
- Bases de ligne de commande (`curl`, terminal)
- Docker + Docker Compose installes

## 4) Ce qu'il faut pour decouvrir Elasticsearch
- Un environnement local de test (sandbox) avec:
  - Elasticsearch
  - Kibana
- Un jeu de donnees simple (ex: produits, logs applicatifs, articles)
- Une liste de cas d'usage a pratiquer:
  - recherche plein texte
  - filtres / tris / pagination
  - agregations
  - mapping et analyzers
  - diagnostic de performance (profiling basique)

## 5) Plan pedagogique propose (2 jours)

### Module 1 - Fondamentaux (2h)
- Architecture Elasticsearch
- Index, document, shard, replica
- Cycle indexation -> recherche
- Role de Kibana

### Module 2 - Prise en main API (2h)
- CRUD d'index et de documents
- Bulk API
- Recherche simple (`match`, `term`, `bool`)
- Tri, pagination, source filtering

### Module 3 - Mapping et analyse de texte (2h30)
- Mapping dynamique vs explicite
- Types de champs (`text`, `keyword`, `date`, `nested`)
- Analyseurs, tokenization, stop words
- Bonnes pratiques de schema

### Module 4 - Recherche avancee (2h30)
- Relevance scoring (BM25)
- Multi-match, fuzziness, boosting
- Highlighting
- Suggestions / autocomplete (intro)

### Module 5 - Aggregations et analytics (2h)
- Metrics aggregations
- Bucket aggregations
- Facettes et tableaux de bord Kibana

### Module 6 - Operations & performance (2h)
- Sizing initial
- Gestion shards/replicas
- Reindex et aliases
- Surveillance de base (health, cat APIs)

## 6) Ateliers pratiques (fil rouge)
1. Creer un index `products` avec mapping explicite
2. Importer un dataset avec Bulk API
3. Construire une recherche e-commerce (texte + filtres + tri)
4. Ajouter des aggregations pour les facettes (categorie, marque, prix)
5. Mesurer et ameliorer une requete lente

## 7) Livrables de fin de cours
- Collection de requetes testees
- Index template de reference
- Checklist "pre-prod" (mapping, perfs, observabilite)

## 8) Sandbox Docker
Le dossier [`sandbox`](/Users/antoinelucsko/Desktop/HETIC/ELK/sandbox) contient l'environnement de test.

Commandes rapides:
```bash
cd sandbox
docker compose up -d
curl http://localhost:9200
open http://localhost:5601
```
