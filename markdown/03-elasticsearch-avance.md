# Cours 3 - Elasticsearch Avance
## Pertinence, performance et cycle de vie

---

## Objectif du chapitre

- Comprendre les leviers de pertinence
- Diagnostiquer score et latence avec les APIs de debug
- Paginer proprement a grande echelle
- Migrer un schema sans downtime applicatif

---


## Reperes theoriques (moteur prod)

- Le schema influence precision, agregations et cout CPU
- Le ranking est un choix produit, pas seulement technique
- La latence depend autant de la requete que du mapping
- Un index evolue: versioning + alias sont des fondamentaux

---

## Multi-fields: un champ, deux usages

```json
"title": {
  "type": "text",
  "fields": {
    "keyword": { "type": "keyword", "ignore_above": 256 }
  }
}
```

Ce que fait le code:
- `title` sert a la recherche linguistique (`text`)
- `title.keyword` sert au tri et aux aggregations exactes

Test concret:

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 0,
  "aggs": {
    "top_titles": { "terms": { "field": "title.keyword" } }
  }
}'
```

---

## Analyze API: comprendre la <span class="glossary-term" data-definition="Decoupage d'un texte en tokens utilises par le moteur pour indexer et rechercher.">tokenisation</span>

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_analyze?pretty" -H "Content-Type: application/json" -d '{
  "field": "title",
  "text": "Casque Audio Bluetooth"
}'
```

Ce que fait le code:
- Montre les tokens reellement indexes
- Explique pourquoi certaines recherches matchent (ou non)

Repere theorique:
- Les tokens produits ici determinent la rappel/precision du moteur

---

## Relevance tuning avec `bool` et `should`

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "query": {
    "bool": {
      "should": [
        { "match": { "title": "bluetooth" } },
        { "match": { "description": "bluetooth" } }
      ],
      "minimum_should_match": 1
    }
  }
}'
```

Ce que fait le code:
- Favorise les documents qui matchent plusieurs champs
- Garantit au moins un match `should`

Repere theorique:
- `should` module le score et peut servir de boosting metier

---

## Expliquer un score (<span class="glossary-term" data-definition="API Elasticsearch qui detaille la construction du score d'un document pour une requete.">`_explain`</span>)

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_explain/1?pretty" -H "Content-Type: application/json" -d '{
  "query": { "match": { "title": "bluetooth" } }
}'
```

Ce que fait le code:
- Donne la decomposition du score doc par doc
- Permet de justifier le ranking en detail

---

## Profiler une requete (`profile: true`)

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "profile": true,
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "sans fil" } }
      ],
      "filter": [
        { "term": { "in_stock": true } }
      ]
    }
  }
}'
```

Ce que fait le code:
- Expose le temps passe dans chaque composant de requete
- Aide a isoler le cout des clauses lentes

---

## Pagination scalable avec <span class="glossary-term" data-definition="Methode de pagination profonde basee sur le tri du dernier document retourne.">`search_after`</span>

Repere theorique:
- Eviter `from + size` sur gros offsets
- Utiliser un tri deterministe et continuer via curseur de tri

Page 1:

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 2,
  "sort": [
    { "price": "asc" },
    { "_id": "asc" }
  ],
  "query": { "match_all": {} }
}'
```

Page 2 (reprendre `sort` du dernier hit de la page 1):

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search?pretty" -H "Content-Type: application/json" -d '{
  "size": 2,
  "sort": [
    { "price": "asc" },
    { "_id": "asc" }
  ],
  "search_after": [99.9, "1"],
  "query": { "match_all": {} }
}'
```

---

## Migration de schema sans downtime (<span class="glossary-term" data-definition="Nom logique pointant vers un index, utile pour basculer de version sans couper l'application.">alias</span>)

```bash
curl -X POST "http://localhost:9200/_reindex" -H "Content-Type: application/json" -d '{
  "source": { "index": "products_v1" },
  "dest":   { "index": "products_v2" }
}'

curl -X POST "http://localhost:9200/_aliases" -H "Content-Type: application/json" -d '{
  "actions": [
    { "remove": { "index": "products_v1", "alias": "products_current" } },
    { "add":    { "index": "products_v2", "alias": "products_current" } }
  ]
}'
```

Ce que fait le code:
- Copie les donnees vers une nouvelle version d'index
- Bascule l'alias applicatif en une operation atomique

---

## Checklist de passage en production

- Mapping explicite et versionne
- Jeux de requetes de reference (qualite + perf)
- Suivi de `took` et taille index
- Strategie `reindex + alias` documentee
- Tests de pertinence sur vrais cas metier

---
