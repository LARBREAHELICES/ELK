# Support de Cours: Elasticsearch comme moteur de recherche

## 1. Objectif
Decouvrir la puissance d Elasticsearch en tant que moteur de recherche:
- recherche full-text
- pertinence (scoring)
- filtres et combinaisons de criteres
- requetes avancees pour des cas proches d une vraie application.

Ce support se concentre volontairement sur Elasticsearch (sans Kibana dans un premier temps).

## 2. Ce qu Elasticsearch fait de special

Elasticsearch n est pas juste une base JSON:
1. il decoupe le texte en tokens (analyseur)
2. il construit un index inverse
3. il calcule un score de pertinence (BM25)
4. il permet des requetes melangeant texte + filtres + tri.

C est ce qui le rend tres efficace pour:
- recherche produit e-commerce
- recherche documentaire
- moteur de recherche interne (FAQ, wiki, support).

## 3. Prerequis

Verifier que le service repond:
```bash
curl http://localhost:9200
```

## 4. TP 1 - Creer un index "catalogue" bien type

### 4.1 Creation de l index
```bash
curl -X PUT "http://localhost:9200/catalogue_demo" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "description": { "type": "text" },
      "brand": { "type": "keyword" },
      "category": { "type": "keyword" },
      "price": { "type": "float" },
      "in_stock": { "type": "boolean" },
      "created_at": { "type": "date" }
    }
  }
}'
```

Pourquoi:
- `text`: recherche linguistique (`match`, `match_phrase`)
- `keyword`: filtre exact/agregation (`term`, `terms`)
- `float`, `boolean`, `date`: filtres metier efficaces.

### 4.2 Injection de documents
```bash
curl -X POST "http://localhost:9200/catalogue_demo/_bulk" -H "Content-Type: application/x-ndjson" -d '
{"index":{"_id":"1"}}
{"title":"Casque audio bluetooth","description":"Casque sans fil reduction de bruit active","brand":"Acme","category":"audio","price":99.9,"in_stock":true,"created_at":"2026-01-10"}
{"index":{"_id":"2"}}
{"title":"Ecouteurs sport","description":"Ecouteurs intra auriculaires bluetooth etanche","brand":"Acme","category":"audio","price":59.0,"in_stock":true,"created_at":"2026-01-14"}
{"index":{"_id":"3"}}
{"title":"Clavier mecanique","description":"Clavier gaming switch rouge","brand":"KeyPro","category":"informatique","price":129.0,"in_stock":false,"created_at":"2026-01-20"}
{"index":{"_id":"4"}}
{"title":"Souris ergonomique","description":"Souris sans fil pour bureautique","brand":"KeyPro","category":"informatique","price":49.9,"in_stock":true,"created_at":"2026-02-01"}
{"index":{"_id":"5"}}
{"title":"Ecran 27 pouces","description":"Moniteur 4k dalle ips","brand":"ViewMax","category":"informatique","price":299.0,"in_stock":true,"created_at":"2026-02-10"}
'
```

## 5. TP 2 - Comprendre l analyse de texte

Voir comment Elasticsearch tokenise:
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_analyze" -H "Content-Type: application/json" -d '{
  "field": "title",
  "text": "Casque Audio Bluetooth"
}'
```

Tu verras des tokens normalises (minuscules).  
C est la base de la recherche full-text.

## 6. TP 3 - Requetes fondamentales

### 6.1 Recherche full-text (`match`)
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": { "match": { "description": "sans fil bluetooth" } }
}'
```

### 6.2 Filtre exact (`term`)
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": { "term": { "brand": "Acme" } }
}'
```

### 6.3 Recherche phrase exacte (`match_phrase`)
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": { "match_phrase": { "title": "casque audio" } }
}'
```

### 6.4 Requete composee (`bool`)
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "sans fil" } }
      ],
      "filter": [
        { "term": { "in_stock": true } },
        { "range": { "price": { "lte": 120 } } }
      ],
      "must_not": [
        { "term": { "category": "informatique" } }
      ]
    }
  }
}'
```

## 7. TP 4 - Pertinence et scoring

### 7.1 Voir le score
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": { "match": { "title": "bluetooth" } }
}'
```

Observe `_score`: plus il est eleve, plus le document est juge pertinent.

### 7.2 Booster un champ
```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": {
    "multi_match": {
      "query": "bluetooth",
      "fields": ["title^3", "description"]
    }
  }
}'
```

Ici, `title^3` signifie: le match dans le titre vaut plus que dans la description.

## 8. TP 5 - Tolerance aux fautes de frappe

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "query": {
    "match": {
      "title": {
        "query": "bluetoth",
        "fuzziness": "AUTO"
      }
    }
  }
}'
```

Tres utile pour l experience utilisateur d un moteur de recherche.

## 9. TP 6 - Facettes (premiere approche)

```bash
curl -X GET "http://localhost:9200/catalogue_demo/_search" -H "Content-Type: application/json" -d '{
  "size": 0,
  "aggs": {
    "brands": { "terms": { "field": "brand" } },
    "categories": { "terms": { "field": "category" } },
    "avg_price": { "avg": { "field": "price" } }
  }
}'
```

Ce sont les bases des filtres facettes que tu verras ensuite en Kibana.

## 10. Cas usage application (vision produit)

Pour une application e-commerce:
1. utilisateur saisit une requete libre
2. backend appelle Elasticsearch (`multi_match` + filtres)
3. Elasticsearch renvoie documents tries par pertinence
4. l UI affiche resultats + facettes (marque, categorie, prix).

Elasticsearch devient la couche de recherche, pas la base transactionnelle.

## 11. Bonnes pratiques

1. Toujours definir un mapping explicite.
2. Separer champs `text` et `keyword` selon usage.
3. Utiliser `filter` pour les contraintes exactes (plus performant).
4. Utiliser `must` pour le texte (pertinence).
5. Mesurer la qualite du ranking sur des requetes reelles.

## 12. Ordre pedagogique recommande (ta proposition)

Ton plan est excellent:
1. Elasticsearch pour comprendre la recherche (ce support)
2. Kibana pour stats et graphiques
3. Logstash pour un cas d ingestion/normalisation reel

C est un enchainement logique: moteur -> visualisation -> pipeline d ingestion.
